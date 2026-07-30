import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173/litopis/";
const docsPort = new URL(baseURL).port || "5173";

export default defineConfig({
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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
    trace: "retain-on-failure",
  },
  webServer: {
    command: `bun run dev -- --port ${docsPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
});
