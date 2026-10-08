const assert = require('node:assert/strict');
const { test } = require('node:test');
const { IsString, MinLength } = require('class-validator');
const {
  validateEnvironment,
} = require('../dist/config/environment.validation');
const { buildDatabaseOptions } = require('../dist/database/database.options');
const {
  createValidationPipe,
} = require('../dist/shared/utils/validation.util');
const {
  GlobalExceptionFilter,
} = require('../dist/shared/filters/http-exception.filter');
const {
  BadRequestException,
  NotFoundException,
  Logger,
} = require('@nestjs/common');

// Test-only values; application configuration has no embedded credentials.
const environment = {
  DATABASE_HOST: '127.0.0.1',
  DATABASE_USER: 'fixture',
  DATABASE_PASSWORD: 'fixture-only-password',
  DATABASE_NAME: 'fixture',
  JWT_SECRET: 'fixture-only-signing-secret-at-least-32-characters',
};

test('configuration requires every database binding and never exposes its values', () => {
  assert.throws(
    () => validateEnvironment({}),
    /DATABASE_HOST.*DATABASE_USER.*DATABASE_PASSWORD.*DATABASE_NAME/,
  );
  assert.throws(
    () =>
      validateEnvironment({ ...environment, PORT: 'sensitive-invalid-value' }),
    (error) =>
      error.message.includes('PORT') &&
      !error.message.includes('sensitive-invalid-value'),
  );
});

test('configuration rejects invalid ports, booleans and environments', () => {
  for (const PORT of ['0', '65536', '1.5', 'abc', '']) {
    assert.throws(() => validateEnvironment({ ...environment, PORT }), /PORT/);
  }
  assert.throws(
    () => validateEnvironment({ ...environment, DATABASE_SSL: 'yes' }),
    /DATABASE_SSL/,
  );
  assert.throws(
    () => validateEnvironment({ ...environment, NODE_ENV: 'staging' }),
    /NODE_ENV/,
  );
  assert.throws(
    () =>
      validateEnvironment({
        ...environment,
        JWT_ACCESS_TOKEN_TTL_SECONDS: '0',
      }),
    /JWT_ACCESS_TOKEN_TTL_SECONDS/,
  );
});

test('CORS accepts exact origins and rejects wildcard, paths, and userinfo', () => {
  const config = validateEnvironment({
    ...environment,
    CORS_ORIGINS:
      'http://localhost:3000, https://web.example.com,http://localhost:3000',
  });
  assert.deepEqual(config.app.corsOrigins, [
    'http://localhost:3000',
    'https://web.example.com',
  ]);
  for (const CORS_ORIGINS of [
    '*',
    'https://example.com/path',
    'https://example.com/',
    'https://user:password@example.com',
    'ftp://example.com',
  ]) {
    assert.throws(
      () => validateEnvironment({ ...environment, CORS_ORIGINS }),
      /CORS_ORIGINS/,
    );
  }
  assert.deepEqual(validateEnvironment(environment).app.corsOrigins, []);
});

test('JWT configuration requires a strong signing secret', () => {
  assert.throws(
    () => validateEnvironment({ ...environment, JWT_SECRET: undefined }),
    /JWT_SECRET/,
  );
  assert.throws(
    () => validateEnvironment({ ...environment, JWT_SECRET: '' }),
    /JWT_SECRET/,
  );
  assert.throws(
    () => validateEnvironment({ ...environment, JWT_SECRET: 'short' }),
    /JWT_SECRET/,
  );
  assert.equal(
    validateEnvironment({ ...environment, JWT_SECRET: 'a'.repeat(32) }).jwt
      .secret.length,
    32,
  );
});

test('database options disable automatic schema changes and verify TLS when enabled', () => {
  const config = validateEnvironment({ ...environment, DATABASE_SSL: 'true' });
  const options = buildDatabaseOptions(config.database);
  assert.equal(options.synchronize, false);
  assert.equal(options.migrationsRun, false);
  assert.equal(options.logging, false);
  assert.deepEqual(options.ssl, { rejectUnauthorized: true });
  assert.equal(options.type, 'postgres');
  assert.equal(options.extra.max, 5);
});

// A fixture DTO exercises the shared pipe without adding business endpoints.
class ProbeDto {}
IsString()(ProbeDto.prototype, 'name');
MinLength(2)(ProbeDto.prototype, 'name');
const metadata = { type: 'body', metatype: ProbeDto, data: undefined };

test('validation transforms a valid request into its DTO', async () => {
  const result = await createValidationPipe().transform(
    { name: 'valid' },
    metadata,
  );
  assert.ok(result instanceof ProbeDto);
});

test('validation rejects extra properties and invalid types without coercion', async () => {
  const pipe = createValidationPipe();
  for (const body of [
    { name: 'valid', extra: true },
    { name: 123 },
    {},
    { name: 'x' },
  ]) {
    await assert.rejects(
      () => pipe.transform(body, metadata),
      BadRequestException,
    );
  }
});

function captureError(exception, filter = new GlobalExceptionFilter()) {
  let status;
  let body;
  const response = {
    status(value) {
      status = value;
      return this;
    },
    json(value) {
      body = value;
    },
  };
  filter.catch(exception, {
    switchToHttp: () => ({ getResponse: () => response }),
  });
  return { status, body };
}

test('exception filter preserves validation errors in the standard envelope', () => {
  const { status, body } = captureError(
    new BadRequestException(['name must be a string']),
  );
  assert.equal(status, 400);
  assert.deepEqual(body, {
    success: false,
    data: null,
    message: 'name must be a string',
    code: 'VALIDATION_ERROR',
  });
});

test('unexpected exceptions never expose sensitive details in response or logs', (context) => {
  const logger = context.mock.method(Logger.prototype, 'error', () => {});
  const { status, body } = captureError(
    new Error('password=secret authorization=token'),
  );
  assert.equal(status, 500);
  assert.equal(body.message, 'Internal server error');
  assert.equal(body.code, 'INTERNAL_ERROR');
  assert.equal(logger.mock.calls.length, 1);
  const log = JSON.stringify(logger.mock.calls[0].arguments);
  assert.ok(!log.includes('password') && !log.includes('token'));
});

test('404 errors do not echo a requested URL', () => {
  const { body } = captureError(
    new NotFoundException('Cannot GET /missing?token=secret'),
  );
  assert.equal(body.message, 'Resource not found');
  assert.equal(body.code, 'NOT_FOUND');
});
