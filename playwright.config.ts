import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: ".env.e2e", override: true });

const databaseUrl = process.env.DATABASE_URL ?? "";
if (!databaseUrl.includes("debodas_web_e2e")) {
  throw new Error("Playwright requiere la base aislada debodas_web_e2e");
}
if (process.env.EMAIL_QUEUE_AUTO_PROCESS !== "false") {
  throw new Error("Playwright requiere EMAIL_QUEUE_AUTO_PROCESS=false");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      EMAIL_QUEUE_AUTO_PROCESS: "false",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
