import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];

export default defineConfig({
  testDir: './src/test/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command:
        "DATABASE_URL='postgresql://todo:todo@localhost:5433/todo' BIND=127.0.0.1 PORT=3001 ALLOW_PUBLIC_BIND=false LOG_LEVEL=info NODE_ENV=development CORS_ORIGIN=http://localhost:5173 pnpm --filter server dev",
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: !isCI,
      timeout: 60_000,
      cwd: '../..',
    },
    {
      command: 'pnpm --filter client dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !isCI,
      timeout: 60_000,
      cwd: '../..',
    },
  ],
});
