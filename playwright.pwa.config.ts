import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/pwa',
  fullyParallel: false,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-production-pwa',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.CI
          ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }
          : undefined,
      },
    },
    {
      name: 'webkit-ipad-production-pwa',
      use: {
        ...devices['iPad Pro 11'],
        browserName: 'webkit',
        isMobile: true,
        hasTouch: true,
        viewport: { width: 1194, height: 834 },
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
