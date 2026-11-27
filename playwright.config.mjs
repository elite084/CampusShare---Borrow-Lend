import { defineConfig } from '@playwright/test';

const port = process.env.CAMPUSSHARE_TEST_PORT ?? '4174';
const baseURL = `http://127.0.0.1:${port}`;
const channel = process.env.CAMPUSSHARE_TEST_CHANNEL;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: true,
  retries: 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    ...(channel ? { channel } : {}),
    timezoneId: 'Asia/Kolkata',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node preview.mjs',
    env: { CAMPUSSHARE_PORT: port },
    url: baseURL,
    reuseExistingServer: false,
  },
});
