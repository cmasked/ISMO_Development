const fs = require('node:fs');
const crypto = require('node:crypto');
const { chromium, expect } = require('@playwright/test');
(async () => {
  const target = new URL(process.env.LIVE_WEB_URL);
  if (target.protocol !== 'https:') throw new Error('Use the public HTTPS website URL.');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = []; const report = { origin: target.origin, routes: [], assets: [], screenshots: [] };
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', async response => {
    if (response.url().startsWith(target.origin + '/assets/') && /\.js(?:\?|$)/.test(response.url())) {
      const body = await response.body().catch(() => Buffer.alloc(0));
      report.assets.push({ url: response.url(), status: response.status(), sha256: crypto.createHash('sha256').update(body).digest('hex'), matchesSourceBuild: fs.existsSync('dist' + new URL(response.url()).pathname) && fs.readFileSync('dist' + new URL(response.url()).pathname).equals(body), renderApi: body.includes('https://ismo-development.onrender.com/api'), brand: body.includes('Workframe') ? 'Workframe' : body.includes('ISMO') ? 'ISMO' : 'unknown' });
    }
  });
  fs.mkdirSync('live-results', { recursive: true });
  const api = 'https://ismo-development.onrender.com/api';
  const health = await fetch(api + '/health', { signal: AbortSignal.timeout(90000) });
  report.health = { status: health.status, body: await health.json() };
  const me = await fetch(api + '/auth/me');
  report.unauthenticated = { status: me.status, body: await me.json() };
  const preflight = await fetch(api + '/auth/login', { method: 'OPTIONS', headers: { Origin: target.origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  report.cors = { status: preflight.status, allowedOrigin: preflight.headers.get('access-control-allow-origin') };
  for (const route of ['/', '/login', '/register', '/dashboard', '/projects', '/projects/00000000-0000-4000-8000-000000000000', '/tasks', '/missing-page']) {
    const response = await page.goto(target.origin + route, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: route === '/register' ? 'Create your account' : 'Welcome back', exact: true })).toBeVisible();
    report.routes.push({ requested: route, status: response.status(), final: new URL(page.url()).pathname, title: await page.title() });
  }
  await page.goto(target.origin + '/login');
  await page.getByLabel('Email', { exact: true }).fill('public-qa@example.test');
  await page.getByLabel('Password', { exact: true }).fill('temporary-test-value');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await page.getByRole('link', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Full name', { exact: true }).fill('Public QA');
  await page.getByLabel('Email', { exact: true }).fill('public-qa@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Test-password-42');
  await page.getByLabel('Confirm password', { exact: true }).fill('Different-password-42');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('don’t match');
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  for (const theme of ['dark', 'light']) {
    await page.getByRole('button', { name: 'Switch to ' + theme + ' mode', exact: true }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const name = 'login-' + theme + '-' + width + '.png';
      await page.screenshot({ path: 'live-results/' + name, fullPage: true });
      report.screenshots.push(name);
    }
  }
  report.runtimeErrors = errors;
  fs.writeFileSync('live-results/report.json', JSON.stringify(report, null, 2));
  expect(errors).toEqual([]);
  expect(report.health.body.data?.database).toBe('up');
  expect(report.unauthenticated.status).toBe(401);
  expect(report.cors.allowedOrigin).toBe(target.origin);
  expect(report.assets.some(asset => asset.matchesSourceBuild)).toBe(true);
  expect(report.assets.some(asset => asset.brand === 'Workframe' && asset.renderApi)).toBe(true);
  console.log('LIVE_QA_REPORT=' + JSON.stringify(report));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
