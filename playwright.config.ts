import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

const isCI = !!process.env.CI;
const testDir = path.resolve(import.meta.dirname, "tests", "e2e");
const outputDir = path.resolve(import.meta.dirname, ".playwright");
const envFile = path.resolve(import.meta.dirname, ".env.local");

dotenv.config({ path: envFile });

export default defineConfig({
  testDir,
  outputDir,
  maxFailures: 1,
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? "dot" : "list",

  use: {
    baseURL: process.env.TEST_ASTRO_BASE_URL,
    trace: isCI ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
    video: isCI ? "retain-on-failure" : "off",
    headless: true,
  },

  webServer: {
    command: isCI
      ? "bun run build && bun run preview --host 0.0.0.0"
      : "bun run dev-test",
    url: process.env.TEST_ASTRO_BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },

  projects: [
    {
      name: "public routes",
      testMatch: /.*\/public\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "protected routes",
      testMatch: /.*\/protected\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.resolve(
          outputDir,
          process.env.TEST_CLERK_AUTH_PLAYWRIGHT_STORAGE_FILE,
        ),
      },
    },
  ],
});
