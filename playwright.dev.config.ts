import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

// React's development diagnostics are absent from the production export.
export default defineConfig(config, {
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev -- --hostname localhost --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
