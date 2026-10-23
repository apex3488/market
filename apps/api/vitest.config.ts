import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", env: { DATABASE_URL: "pglite:memory", NODE_ENV: "test" }, testTimeout: 30000, hookTimeout: 60000, fileParallelism: false },
});
