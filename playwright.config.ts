import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/unit/**", "**/static/**"],
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  use: { baseURL: "http://127.0.0.1:4173", channel: process.platform === "win32" ? "msedge" : undefined },
  webServer: { command: "node tests/serve-export.mjs", url: "http://127.0.0.1:4173", reuseExistingServer: false },
});
