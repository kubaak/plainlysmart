import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

// Cross-package integration tests require both root and infra dependencies.
// Keep them separate so frontend-only builds/tests remain independent of infra.
export default defineConfig(config, { testDir: "./infra/tests/browser" });
