require('dotenv/config');
require('reflect-metadata');
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const configuration = require('../dist/config/configuration').default;
const { buildDatabaseOptions } = require('../dist/database/database.options');

const testDatabaseName = `ismo_test_${randomUUID().replaceAll('-', '')}`;
const password = 'Test-only-password-123';
let admin;
let migrations;
let app;
let baseUrl;
let alice;
let bob;
let tokenA;
let tokenB;
let projectA;
let projectB;
let taskA;
let initialMigrations;
let reappliedMigrations;

async function request(
  path,
  { method = 'GET', body, token = tokenA, expected = 200 } = {},
) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: unexpected HTTP status`,
  );
  const result = await response.json();
  assert.equal(result.success, expected < 400);
  return { data: result.data, code: result.code, response };
}

before(async () => {
  const options = buildDatabaseOptions(configuration().database);
  admin = await new DataSource(options).initialize();
  // Only the random test-owned database is created/dropped; the configured database is preserved.
  await admin.query(`CREATE DATABASE "${testDatabaseName}"`);
  migrations = await new DataSource({
    ...options,
    database: testDatabaseName,
  }).initialize();
  initialMigrations = await migrations.runMigrations();
  await migrations.undoLastMigration();
  const tablesAfterUndo = await migrations.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public'",
  );
  assert.deepEqual(
    tablesAfterUndo.map((row) => row.tablename),
    ['migrations'],
  );
  reappliedMigrations = await migrations.runMigrations();
  assert.equal((await migrations.runMigrations()).length, 0);

  process.env.DATABASE_NAME = testDatabaseName;
  process.env.NODE_ENV = 'test';
  const { AppModule } = require('../dist/app.module');
  const { configureApplication } = require('../dist/app.setup');
  app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });
  configureApplication(app);
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
  alice = (
    await request('/auth/register', {
      method: 'POST',
      token: null,
      expected: 201,
      body: { fullName: ' Alice Test ', email: 'ALICE@example.test', password },
    })
  ).data;
  bob = (
    await request('/auth/register', {
      method: 'POST',
      token: null,
      expected: 201,
      body: { fullName: 'Bob Test', email: 'bob@example.test', password },
    })
  ).data;
  tokenA = (
    await request('/auth/login', {
      method: 'POST',
      token: null,
      body: { email: alice.email, password },
    })
  ).data.accessToken;
  tokenB = (
    await request('/auth/login', {
      method: 'POST',
      token: null,
      body: { email: bob.email, password },
    })
  ).data.accessToken;
});

after(async () => {
  if (app) await app.close();
  if (migrations?.isInitialized) await migrations.destroy();
  if (admin?.isInitialized) {
    await admin.query(
      `DROP DATABASE IF EXISTS "${testDatabaseName}" WITH (FORCE)`,
    );
    await admin.destroy();
  }
});

test('versioned migrations run, revert, reapply and do not run twice', async () => {
  assert.equal(initialMigrations.length, 1);
  assert.equal(reappliedMigrations.length, 1);
  const tables = await migrations.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public'",
  );
  assert.deepEqual(tables.map((row) => row.tablename).sort(), [
    'auth_sessions',
    'migrations',
    'projects',
    'tasks',
    'users',
  ]);
  assert.equal(app.get(DataSource).options.synchronize, false);
  const comparison = await migrations.driver.createSchemaBuilder().log();
  assert.equal(
    comparison.upQueries.length,
    0,
    'Entity metadata and migrated schema must agree',
  );
});

test('registration normalizes email/name, enforces uniqueness and stores only bcrypt hashes', async () => {
  assert.equal(alice.fullName, 'Alice Test');
  assert.equal(alice.email, 'alice@example.test');
  assert.ok(!('password' in alice) && !('passwordHash' in alice));
  const [stored] = await migrations.query(
    'SELECT password_hash FROM users WHERE id=$1',
    [alice.id],
  );
  assert.ok(await bcrypt.compare(password, stored.password_hash));
  assert.ok(stored.password_hash !== password);
  const duplicate = await request('/auth/register', {
    method: 'POST',
    token: null,
    expected: 409,
    body: {
      fullName: 'Duplicate Test',
      email: ' Alice@EXAMPLE.test ',
      password,
    },
  });
  assert.equal(duplicate.code, 'EMAIL_ALREADY_EXISTS');
  const me = (await request('/auth/me')).data;
  assert.equal(me.id, alice.id);
  assert.ok(!('passwordHash' in me) && !('password' in me));
});

test('login errors are safe and all feature endpoints require authentication', async () => {
  for (const email of [alice.email, 'unknown@example.test']) {
    const result = await request('/auth/login', {
      method: 'POST',
      token: null,
      expected: 401,
      body: { email, password: 'wrong-password' },
    });
    assert.equal(result.code, 'UNAUTHORIZED');
  }
  for (const path of ['/auth/me', '/projects', '/tasks', '/dashboard']) {
    await request(path, { token: null, expected: 401 });
  }
  await request('/auth/logout', { method: 'POST', token: null, expected: 401 });
  await request('/projects', { token: 'malformed-token', expected: 401 });
  assert.deepEqual((await request('/dashboard')).data, {
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    projectsInProgress: 0,
  });
});

test('authentication validates names, emails, passwords and unexpected properties', async () => {
  for (const body of [
    { fullName: '  ', email: 'invalid-name@example.test', password },
    { fullName: 'Invalid Test', email: 'not-an-email', password },
    {
      fullName: 'Invalid Test',
      email: 'short@example.test',
      password: 'short',
    },
    {
      fullName: 'Invalid Test',
      email: 'bytes@example.test',
      password: 'é'.repeat(40),
    },
    {
      fullName: 'Invalid Test',
      email: 'blank@example.test',
      password: ' '.repeat(10),
    },
    {
      fullName: 'Invalid Test',
      email: 'extra@example.test',
      password,
      ownerId: alice.id,
    },
  ])
    await request('/auth/register', {
      method: 'POST',
      token: null,
      expected: 400,
      body,
    });
});

test('project/task CRUD, status changes and dashboard use real owned records', async () => {
  projectA = (
    await request('/projects', {
      method: 'POST',
      expected: 201,
      body: {
        name: ' Alpha Release ',
        description: 'Integration test project',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      },
    })
  ).data;
  assert.equal(projectA.name, 'Alpha Release');
  assert.equal(projectA.status, 'NOT_STARTED');
  assert.equal(projectA.ownerId, alice.id);
  await request(`/projects/${projectA.id}`, {
    method: 'PUT',
    body: { status: 'IN_PROGRESS', description: 'Updated' },
  });
  assert.equal(
    (await request(`/projects/${projectA.id}`)).data.description,
    'Updated',
  );
  projectB = (
    await request('/projects', {
      method: 'POST',
      token: tokenB,
      expected: 201,
      body: { name: 'Bob Private Project', status: 'IN_PROGRESS' },
    })
  ).data;
  taskA = (
    await request('/tasks', {
      method: 'POST',
      expected: 201,
      body: {
        projectId: projectA.id,
        name: 'Prepare release',
        dueDate: '2026-10-20',
      },
    })
  ).data;
  assert.equal(taskA.status, 'PENDING');
  assert.equal(taskA.priority, 'MEDIUM');
  await request(`/tasks/${taskA.id}`, {
    method: 'PUT',
    body: { status: 'IN_PROGRESS', priority: 'HIGH', name: 'Ship release' },
  });
  assert.equal((await request(`/tasks/${taskA.id}`)).data.priority, 'HIGH');
  await request(`/tasks/${taskA.id}`, {
    method: 'PUT',
    body: { status: 'COMPLETED' },
  });
  await request('/tasks', {
    method: 'POST',
    expected: 201,
    body: { projectId: projectA.id, name: 'Pending task' },
  });
  await request('/tasks', {
    method: 'POST',
    expected: 201,
    body: {
      projectId: projectA.id,
      name: 'Active task',
      status: 'IN_PROGRESS',
    },
  });
  await request('/tasks', {
    method: 'POST',
    token: tokenB,
    expected: 201,
    body: { projectId: projectB.id, name: 'Bob only', status: 'COMPLETED' },
  });
  assert.deepEqual((await request('/dashboard')).data, {
    totalProjects: 1,
    totalTasks: 3,
    completedTasks: 1,
    pendingTasks: 1,
    projectsInProgress: 1,
  });
  assert.deepEqual((await request('/dashboard', { token: tokenB })).data, {
    totalProjects: 1,
    totalTasks: 1,
    completedTasks: 1,
    pendingTasks: 0,
    projectsInProgress: 1,
  });
});

test('ownership prevents reading, writing, deleting and moving another user’s resources', async () => {
  for (const method of ['GET', 'PUT', 'DELETE']) {
    await request(`/projects/${projectA.id}`, {
      method,
      token: tokenB,
      expected: 404,
      ...(method === 'PUT' ? { body: { name: 'Unauthorized' } } : {}),
    });
    await request(`/tasks/${taskA.id}`, {
      method,
      token: tokenB,
      expected: 404,
      ...(method === 'PUT' ? { body: { status: 'PENDING' } } : {}),
    });
  }
  await request('/tasks', {
    method: 'POST',
    token: tokenB,
    expected: 404,
    body: { projectId: projectA.id, name: 'Unauthorized' },
  });
  await request(`/tasks/${taskA.id}`, {
    method: 'PUT',
    expected: 404,
    body: { projectId: projectB.id },
  });
  assert.equal((await request('/projects', { token: tokenB })).data.length, 1);
  assert.deepEqual(
    (await request(`/tasks?projectId=${projectA.id}`, { token: tokenB })).data,
    [],
  );
});

test('combined filters and literal name search remain scoped and resist SQL injection', async () => {
  const projects = (await request('/projects?search=alpha&status=IN_PROGRESS'))
    .data;
  assert.equal(projects.length, 1);
  assert.equal(projects[0].id, projectA.id);
  const tasks = (
    await request(
      `/tasks?search=SHIP&status=COMPLETED&priority=HIGH&projectId=${projectA.id}`,
    )
  ).data;
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, taskA.id);
  for (const search of ["' OR 1=1 --", '%', '_']) {
    assert.deepEqual(
      (await request(`/projects?search=${encodeURIComponent(search)}`)).data,
      [],
    );
    assert.deepEqual(
      (await request(`/tasks?search=${encodeURIComponent(search)}`)).data,
      [],
    );
  }
});

test('validation rejects blank names, unexpected fields, invalid enums, UUIDs and dates', async () => {
  for (const body of [
    { name: '   ' },
    { name: 'Invalid', status: 'INVALID' },
    { name: 'Invalid', status: null },
    { name: 'Invalid', ownerId: bob.id },
    { name: 'Invalid', startDate: '2026-02-30' },
    { name: 'Invalid', startDate: '0000-01-01' },
    { name: 'Invalid', startDate: '2026-10-31', endDate: '2026-10-01' },
  ])
    await request('/projects', { method: 'POST', body, expected: 400 });
  for (const body of [
    {},
    { name: null },
    { status: null },
    { startDate: '2026-11-01' },
  ]) {
    await request(`/projects/${projectA.id}`, {
      method: 'PUT',
      body,
      expected: 400,
    });
  }
  for (const body of [
    { projectId: projectA.id, name: '   ' },
    { projectId: 'bad', name: 'Invalid' },
    { projectId: projectA.id, name: 'Invalid', dueDate: '2026-02-29' },
    { projectId: projectA.id, name: 'Invalid', priority: null },
    { projectId: projectA.id, name: 'Invalid', status: 'INVALID' },
  ])
    await request('/tasks', { method: 'POST', body, expected: 400 });
  for (const body of [
    {},
    { projectId: null },
    { priority: null },
    { name: null },
  ]) {
    await request(`/tasks/${taskA.id}`, { method: 'PUT', body, expected: 400 });
  }
  for (const path of [
    '/projects/bad',
    '/tasks/bad',
    '/projects?status=INVALID',
    '/tasks?priority=INVALID',
    '/tasks?projectId=bad',
    '/tasks?unknown=1',
  ]) {
    await request(path, { expected: 400 });
  }
  await request(`/projects/${projectA.id}`, {
    method: 'PUT',
    body: { startDate: null, endDate: null, description: null },
  });
  assert.equal(
    (await request(`/projects/${projectA.id}`)).data.startDate,
    null,
  );
});

test('task movement between owned projects and project deletion cascade correctly', async () => {
  const other = (
    await request('/projects', {
      method: 'POST',
      expected: 201,
      body: { name: 'Disposable owned project' },
    })
  ).data;
  const disposable = (
    await request('/tasks', {
      method: 'POST',
      expected: 201,
      body: { projectId: projectA.id, name: 'Move then delete' },
    })
  ).data;
  const moved = (
    await request(`/tasks/${disposable.id}`, {
      method: 'PUT',
      body: { projectId: other.id },
    })
  ).data;
  assert.equal(moved.projectId, other.id);
  await request(`/projects/${other.id}`, { method: 'DELETE' });
  await request(`/projects/${other.id}`, { expected: 404 });
  await request(`/tasks/${disposable.id}`, { expected: 404 });
  await request(`/tasks/${taskA.id}`, { method: 'DELETE' });
  await request(`/tasks/${taskA.id}`, { expected: 404 });
  const dashboard = (await request('/dashboard')).data;
  assert.equal(dashboard.totalTasks, 2);
  assert.equal(dashboard.completedTasks, 0);
});

test('database constraints independently enforce foreign keys, nonblank names and date ranges', async () => {
  await assert.rejects(
    () =>
      migrations.query(
        'INSERT INTO projects (owner_id, name, start_date, end_date) VALUES ($1,$2,$3,$4)',
        [alice.id, 'Invalid range', '2026-10-31', '2026-10-01'],
      ),
    (error) => error.driverError.code === '23514',
  );
  await assert.rejects(
    () =>
      migrations.query('INSERT INTO tasks (project_id, name) VALUES ($1,$2)', [
        randomUUID(),
        'Orphan',
      ]),
    (error) => error.driverError.code === '23503',
  );
  await assert.rejects(
    () =>
      migrations.query('INSERT INTO projects (owner_id, name) VALUES ($1,$2)', [
        alice.id,
        '   ',
      ]),
    (error) => error.driverError.code === '23514',
  );
});

test('expired and tampered JWTs are rejected with safe errors', async () => {
  const signer = new JwtService({ secret: process.env.JWT_SECRET });
  const decoded = signer.decode(tokenA);
  const expired = signer.sign(
    { sub: alice.id, sessionId: decoded.sessionId },
    {
      algorithm: 'HS256',
      issuer: 'ismo-backend',
      audience: 'ismo-clients',
      expiresIn: -1,
    },
  );
  assert.equal(
    (await request('/auth/me', { token: expired, expected: 401 })).code,
    'TOKEN_EXPIRED',
  );
  const parts = tokenA.split('.');
  const tampered = `${parts[0]}.${Buffer.from(JSON.stringify({ ...decoded, sub: bob.id })).toString('base64url')}.${parts[2]}`;
  await request('/auth/me', { token: tampered, expected: 401 });
});

test('logout invalidates its session immediately while another device session remains valid', async () => {
  const second = (
    await request('/auth/login', {
      method: 'POST',
      token: null,
      body: { email: alice.email, password },
    })
  ).data;
  assert.equal(second.user.id, alice.id);
  await request('/auth/logout', { method: 'POST' });
  assert.equal(
    (await request('/auth/me', { expected: 401 })).code,
    'SESSION_INVALID',
  );
  await request('/dashboard', { expected: 401 });
  assert.equal(
    (await request('/auth/me', { token: second.accessToken })).data.id,
    alice.id,
  );
  assert.equal((await request('/auth/me', { token: tokenB })).data.id, bob.id);
});

test('authentication rate limiting returns 429 and Retry-After after repeated attempts', async () => {
  let blocked = false;
  for (let attempt = 0; attempt < 11; attempt++) {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rate-limit@example.test',
        password: 'wrong-password',
      }),
    });
    if (response.status === 429) {
      assert.equal((await response.json()).code, 'RATE_LIMITED');
      assert.ok(response.headers.get('retry-after'));
      blocked = true;
      break;
    }
    assert.equal(response.status, 401);
  }
  assert.ok(blocked, 'Repeated login attempts must be rate limited');
});

test('OpenAPI documents every required endpoint and its bearer security', async () => {
  const spec = await (await fetch(`${baseUrl}/docs-json`)).json();
  for (const [path, methods] of Object.entries({
    '/api/auth/register': ['post'],
    '/api/auth/login': ['post'],
    '/api/auth/logout': ['post'],
    '/api/auth/me': ['get'],
    '/api/projects': ['get', 'post'],
    '/api/projects/{id}': ['get', 'put', 'delete'],
    '/api/tasks': ['get', 'post'],
    '/api/tasks/{id}': ['get', 'put', 'delete'],
    '/api/dashboard': ['get'],
  })) {
    for (const method of methods)
      assert.ok(
        spec.paths[path]?.[method],
        `${method} ${path} missing from OpenAPI`,
      );
  }
  assert.ok(
    spec.paths['/api/projects'].get.security.some((item) => 'bearer' in item),
  );
  assert.equal((await fetch(`${baseUrl}/docs`)).status, 200);
});
