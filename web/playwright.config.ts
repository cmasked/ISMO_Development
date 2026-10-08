import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, retries: 0,
  timeout: 90000, expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3000', browserName: 'chromium', viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'npm run start:prod --prefix ../backend', url: 'http://127.0.0.1:3001/api/health', timeout: 60000, reuseExistingServer: !process.env.CI },
    { command: 'npm run preview', url: 'http://127.0.0.1:3000', timeout: 30000, reuseExistingServer: !process.env.CI },
  ],
});
