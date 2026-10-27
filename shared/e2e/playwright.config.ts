// Suite d'acceptation partagée (research R7).
// Usage : APP_URL=http://localhost:4173 FRAMEWORK=react npm run e2e   (depuis shared/)

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  outputDir: "./test-results",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  reporter: [["list"], ["./mesures-reporter.ts"]],
  use: {
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: "standard",
      grepInvert: /@repli/,
      use: { launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } },
    },
    {
      name: "sans-3d",
      grep: /@repli/,
      use: { launchOptions: { args: ["--disable-3d-apis"] } },
    },
  ],
});
