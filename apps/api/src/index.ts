import { serve } from "@hono/node-server";
import { buildApp } from "./app";
import { initDb } from "./db/client";
import { env, isProd } from "./env";

const handle = await initDb(env.DATABASE_URL);
// Local embedded database migrates itself; Neon is migrated explicitly with `npm run db:migrate`.
if (env.DATABASE_URL.startsWith("pglite:")) await handle.migrate();

const app = buildApp();
const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`BAYHAN MARKET API on http://localhost:${info.port} (${isProd ? "production" : env.NODE_ENV})`);
});

const shutdown = async () => {
  server.close();
  await handle.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
