const { chromium, expect } = require('../../web/node_modules/@playwright/test');
const fs = require('fs');
(async () => {
  const email = process.env.TEST_EMAIL;
  if (!email || !email.endsWith('@example.test')) throw new Error('Use the isolated CI account.');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://127.0.0.1:3000/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Test-password-42');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByTestId('metric-completedTasks').getByText(process.argv[2] === 'after-native' ? '1' : '2', { exact: true })).toBeVisible();
    await page.locator('.sidebar').getByRole('link', { name: 'Projects', exact: true }).click();
    await page.waitForURL('**/projects');
    await page.getByRole('heading', { name: 'Projects', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Android launch', exact: true }).click();
    if (process.argv[2] === 'after-native') {
      await expect(page.getByLabel('Status for Review launch content')).toHaveValue('COMPLETED');
      await page.getByRole('button', { name: 'Create a task', exact: true }).first().click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Task name').fill('Created on web');
      await dialog.getByRole('button', { name: 'Create task', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(page.locator('.task-main>strong').filter({ hasText: 'Created on web' })).toBeVisible();
    } else {
      await expect(page.getByLabel('Status for Completed from Android')).toHaveValue('COMPLETED');
      await page.getByLabel('Status for Completed from Android').selectOption('IN_PROGRESS');
      await expect(page.getByLabel('Status for Completed from Android')).toHaveValue('IN_PROGRESS');
      await expect(page.getByText('1 of 2 tasks completed', { exact: true })).toBeVisible();
    }
    fs.mkdirSync('mobile/native-results', { recursive: true });
    await page.screenshot({ path: 'mobile/native-results/web-' + process.argv[2] + '.png', fullPage: true });
    console.log('Cross-platform browser flow passed: ' + process.argv[2]);
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exit(1); });
