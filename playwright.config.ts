import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173/litopis/";
const docsPort = new URL(baseURL).port || "5173";

export default defineConfig({
  fullyParallel: true,
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  reporter: process.env.CI ? "github" : "list",
  testDir: "./tests/browser",
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
  },
  workers: 2,
  webServer: {
    command: `bun run dev -- --port ${docsPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
});
