import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Look for test files in the "tests/e2e" directory
  testDir: 'tests/e2e',
  
  // Maximum time in milliseconds the whole test suite can run
  timeout: 60000,
  
  // The base URL to use in navigation
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    viewport: { width: 1280, height: 720 },
    // Capture a screenshot after each test failure
    screenshot: 'only-on-failure',
    // Record trace for each test, helpful for debugging
    trace: 'on-first-retry',
  },
  
  // Launch the web server before running tests
  webServer: {
    command: 'npm run dev',
    port: 5174,
    timeout: 120000, // Increase timeout to allow both servers to start
    reuseExistingServer: !process.env.CI,
  },
  
  // Configure reporters
  reporter: [['html'], ['list']],
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left a test.only in the source code
  forbidOnly: !!process.env.CI,
});