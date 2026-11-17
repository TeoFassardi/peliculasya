import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npx tsx tests/preview-server.ts",
      cwd: "../backend",
      url: "http://localhost:3000/health",
      timeout: 180_000,
    },
    {
      command: "npm run dev -- --host localhost --strictPort",
      url: "http://localhost:5173",
    },
  ],
});
