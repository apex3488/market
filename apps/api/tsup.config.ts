import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/db/migrate.ts", "src/db/seed.ts", "src/scripts/create-admin.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  splitting: true,
  // bundle the shared TS package; keep real npm deps external
  noExternal: ["@bayhan/shared"],
});
