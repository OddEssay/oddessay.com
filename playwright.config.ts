import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4322' },
  projects: [
    // Content writes trigger global HMR; finish them before testing image interactions.
    { name: 'authoring', testMatch: '**/restaurant-discovery.spec.mjs' },
    { name: 'desktop', dependencies: ['authoring'], testIgnore: '**/restaurant-discovery.spec.mjs', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', dependencies: ['authoring'], testIgnore: '**/restaurant-discovery.spec.mjs', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'node scripts/browser-server.mjs', url: 'http://127.0.0.1:4322/test-fixture/image', reuseExistingServer: false },
});
