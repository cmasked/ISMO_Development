import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SessionController, parseSession, type Storage } from '../src/lib/session';
import { calendarDate, passwordError, utf8Length, validDate } from '../src/lib/validation';
import type { Session } from '../src/types';
function session(token = 'token'): Session { return { accessToken: token, expiresAt: new Date(Date.now() + 60000).toISOString(), user: { id: 'user', fullName: 'Test User', email: 'test@example.test', createdAt: '', updatedAt: '' } }; }
function storage(initial: string | null = null) { let value = initial; return { get: async () => value, set: async (next: string) => { value = next; }, remove: async () => { value = null; } }; }
test('expired and corrupt persisted sessions never become authenticated', async () => {
  for (const raw of ['bad-json', JSON.stringify({ ...session(), expiresAt: new Date(0).toISOString() })]) {
    const disk = storage(raw); let calls = 0;
    const controller = new SessionController({ me: async () => { ++calls; return session().user; }, login: async () => session(), logout: async () => ({}) }, disk);
    await controller.restore(); assert.equal(controller.snapshot().status, 'signedOut'); assert.equal(calls, 0); assert.equal(await disk.get(), null);
  }
  assert.equal(parseSession(JSON.stringify({ accessToken: 'token', expiresAt: 'invalid' })), null);
});
test('secure persistence is required before publishing a successful sign-in', async () => {
  const disk: Storage = { get: async () => null, set: async () => { throw new Error('device unavailable'); }, remove: async () => {} };
  const controller = new SessionController({ me: async () => session().user, login: async () => session(), logout: async () => ({}) }, disk);
  await assert.rejects(controller.login('test@example.test', 'password'), /securely/);
  assert.equal(controller.current(), null);
});
test('offline logout preserves the session; successful logout erases it', async () => {
  const disk = storage(); let fail = true;
  const controller = new SessionController({ me: async () => session().user, login: async () => session(), logout: async () => { if (fail) throw new Error('offline'); return {}; } }, disk);
  await controller.login('test@example.test', 'password');
  await assert.rejects(controller.logout()); assert.equal(controller.snapshot().status, 'signedIn'); assert.ok(await disk.get());
  fail = false; await controller.logout(); assert.equal(controller.snapshot().status, 'signedOut'); assert.equal(await disk.get(), null);
});
test('a late startup response cannot restore authentication after expiry', async () => {
  const saved = session(); let resolve!: (value: typeof saved.user) => void;
  const pending = new Promise<typeof saved.user>(done => { resolve = done; });
  const controller = new SessionController({ me: () => pending, login: async () => saved, logout: async () => ({}) }, storage(JSON.stringify(saved)));
  const restore = controller.restore();
  await new Promise(done => setTimeout(done, 0));
  await controller.expire(saved.accessToken); resolve(saved.user); await restore;
  assert.equal(controller.snapshot().status, 'signedOut'); assert.equal(controller.current(), null);
});
test('an old request cannot expire a newer sign-in', async () => {
  let count = 0; const controller = new SessionController({ me: async () => session().user, login: async () => session(String(++count)), logout: async () => ({}) }, storage());
  await controller.login('a', 'password'); await controller.login('b', 'password'); await controller.expire('1');
  assert.equal(controller.current()?.accessToken, '2');
});
test('a network failure while restoring can be retried without losing the saved token', async () => {
  const disk = storage(JSON.stringify(session())); let fail = true;
  const controller = new SessionController({ me: async () => { if (fail) throw new Error('offline'); return session().user; }, login: async () => session(), logout: async () => ({}) }, disk);
  await controller.restore(); assert.equal(controller.snapshot().status, 'error'); assert.ok(await disk.get());
  fail = false; await controller.restore(); assert.equal(controller.snapshot().status, 'signedIn');
});
test('date and UTF-8 validation handle leap years, timezones and non-ASCII passwords', () => {
  assert.equal(validDate('2024-02-29'), true); assert.equal(validDate('2025-02-29'), false); assert.equal(validDate('2026-13-01'), false);
  assert.equal(calendarDate(new Date(2026, 9, 9, 23, 59)), '2026-10-09');
  assert.equal(utf8Length('🔷'.repeat(19)), 76); assert.match(passwordError('🔷'.repeat(19), '🔷'.repeat(19)), /too long/);
  assert.match(passwordError('12345678', '12345679'), /don’t match/);
});
