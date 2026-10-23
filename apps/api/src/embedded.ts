import type { Hono } from "hono";
import { buildApp } from "./app";
import { initDb } from "./db/client";
import { env } from "./env";
import type { AppEnv } from "./lib/auth";

/**
 * The same API, mounted inside the Next.js server (one Vercel project).
 * The database connection is created once per server instance.
 */
let ready: Promise<Hono<AppEnv>> | null = null;

export function getApp(): Promise<Hono<AppEnv>> {
  ready ??= (async () => {
    const handle = await initDb(env.DATABASE_URL);
    if (env.DATABASE_URL.startsWith("pglite:")) await handle.migrate();
    return buildApp();
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}
