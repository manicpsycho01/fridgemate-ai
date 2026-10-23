import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  fullyParallel: true,
  workers: 3,
  reporter: [["list"]],
  globalTeardown: "./tests/e2e/teardown.ts",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3500", trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
