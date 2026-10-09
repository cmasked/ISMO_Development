import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const cwd = resolve(import.meta.dirname, '..');
function read(url: string, flags: Record<string, string> = {}) {
  return JSON.parse(execFileSync(process.execPath, ['-e', "console.log(JSON.stringify(require('./app.config.js').expo))"], {
    cwd, env: { ...process.env, CI: '', ISMO_E2E: '', EXPO_PUBLIC_API_BASE_URL: url, ...flags }, stdio: ['ignore', 'pipe', 'pipe']
  }).toString());
}
test('production configuration requires HTTPS, a real host, and the existing API prefix', () => {
  for (const url of ['http://example.com/api', 'https://localhost/api', 'https://127.0.0.1/api', 'https://10.0.2.2/api', 'https://example.com', 'https://user:password@example.com/api']) assert.throws(() => read(url));
  const config = read('https://ismo-development.onrender.com/api');
  assert.equal(config.android.package, 'com.ismo.projects');
  assert.equal(config.extra.apiBaseUrl, 'https://ismo-development.onrender.com/api');
  assert.equal(config.plugins[1][1].android.usesCleartextTraffic, false);
  assert.ok(config.android.blockedPermissions.includes('android.permission.RECORD_AUDIO'));
});
test('insecure emulator URL is restricted to a distinct CI test package', () => {
  assert.throws(() => read('http://10.0.2.2:3001/api', { ISMO_E2E: 'true' }));
  const config = read('http://10.0.2.2:3001/api', { ISMO_E2E: 'true', CI: 'true' });
  assert.equal(config.android.package, 'com.ismo.projects.e2e');
  assert.equal(config.plugins[1][1].android.usesCleartextTraffic, true);
});
