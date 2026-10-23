/**
 * Runs during the Vercel build: applies migrations to Neon (fails the build on error)
 * and, when SEED_DEMO=true, inserts the idempotent demo catalog.
 */
import { env } from "../env";
import { createDb } from "./client";

if (env.DATABASE_URL.startsWith("pglite:")) {
  console.error("DATABASE_URL must point to Neon/Postgres for a Vercel build.");
  process.exit(1);
}
const handle = await createDb(env.DATABASE_URL);
console.log("Applying migrations…");
await handle.migrate();
await handle.close();
console.log("Migrations applied.");

if (process.env.SEED_DEMO === "true") {
  await import("./seed");
}
