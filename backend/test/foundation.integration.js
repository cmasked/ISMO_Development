require('dotenv/config');
require('reflect-metadata');
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { Body, Controller, Module, Post } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { IsString } = require('class-validator');
const { DataSource } = require('typeorm');
const { AppModule } = require('../dist/app.module');
const { configureApplication } = require('../dist/app.setup');

// This controller exists only in the test application to verify global DTO handling.
class ProbeDto {}
IsString()(ProbeDto.prototype, 'name');
class ProbeController {
  create(body) { return { name: body.name }; }
}
Controller('__test_validation')(ProbeController);
const descriptor = Object.getOwnPropertyDescriptor(ProbeController.prototype, 'create');
Reflect.defineMetadata('design:paramtypes', [ProbeDto], ProbeController.prototype, 'create');
Post()(ProbeController.prototype, 'create', descriptor);
Body()(ProbeController.prototype, 'create', 0);
class IntegrationModule {}
Module({ imports: [AppModule], controllers: [ProbeController] })(IntegrationModule);

let app;
let baseUrl;
before(async () => {
  app = await NestFactory.create(IntegrationModule, { logger: false, abortOnError: false });
  configureApplication(app);
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
});
after(async () => { if (app) await app.close(); });

test('application initializes a real PostgreSQL connection without creating schema', async () => {
  const database = app.get(DataSource);
  assert.equal(database.isInitialized, true);
  assert.equal(database.options.synchronize, false);
  assert.equal(database.entityMetadatas.length, 0);
  const before = await database.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true, data: { status: 'ok', database: 'up' }, message: 'Success', code: 'OK',
  });
  const after = await database.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  assert.deepEqual(after, before);
});

test('Swagger UI and OpenAPI are reachable at the documented paths', async () => {
  const response = await fetch(`${baseUrl}/docs`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /swagger-ui/);
  const spec = await (await fetch(`${baseUrl}/docs-json`)).json();
  assert.ok(spec.paths['/api/health']);
  assert.ok(!spec.paths['/api/auth/login']);
});

test('global errors return the expected HTTP status and envelope', async () => {
  const response = await fetch(`${baseUrl}/api/missing?token=must-not-echo`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { success: false, data: null, message: 'Resource not found', code: 'NOT_FOUND' });
});

test('global validation rejects invalid and unknown properties over HTTP', async () => {
  for (const body of [{ name: 123 }, { name: 'valid', extra: true }, {}]) {
    const response = await fetch(`${baseUrl}/api/__test_validation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
    const error = await response.json();
    assert.equal(error.success, false);
    assert.equal(error.code, 'VALIDATION_ERROR');
  }
  const response = await fetch(`${baseUrl}/api/__test_validation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'valid' }),
  });
  assert.equal(response.status, 201);
  assert.deepEqual((await response.json()).data, { name: 'valid' });
});

test('CORS permits configured web origins and withholds access for others', async () => {
  const config = app.get(require('@nestjs/config').ConfigService);
  const origins = config.get('app.corsOrigins');
  assert.ok(origins.length > 0, 'Set CORS_ORIGINS to at least one exact web origin for this check');
  const allowed = await fetch(`${baseUrl}/api/health`, { headers: { Origin: origins[0] } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), origins[0]);
  const denied = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://unlisted.invalid' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const preflight = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: { Origin: origins[0], 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Authorization' },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origins[0]);
  assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization/i);
});
