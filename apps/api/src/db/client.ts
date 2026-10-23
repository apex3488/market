import path from "node:path";
import fs from "node:fs";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export const migrationsDir = path.resolve(process.cwd(), "drizzle");

interface DbHandle {
  db: Db;
  migrate: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Production: Neon (or any Postgres) via postgres.js over TLS.
 * Local dev / tests: embedded PGlite (real Postgres compiled to WASM), no install needed.
 * Clients never talk to the database directly — only this API does.
 */
export async function createDb(url: string): Promise<DbHandle> {
  if (url.startsWith("pglite:")) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const target = url.slice("pglite:".length);
    let client;
    if (target === "memory") client = new PGlite();
    else {
      fs.mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
      client = new PGlite(path.resolve(target));
    }
    const db = drizzle(client, { schema });
    return {
      db: db as unknown as Db,
      migrate: () => migrate(db, { migrationsFolder: migrationsDir }),
      close: () => client.close(),
    };
  }
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const sql = postgres(url, { max: 10, prepare: false, idle_timeout: 20, connect_timeout: 15 });
  const db = drizzlePg(sql, { schema });
  return {
    db,
    migrate: () => migrate(db, { migrationsFolder: migrationsDir }),
    close: () => sql.end({ timeout: 5 }),
  };
}

let handle: DbHandle | null = null;
export async function initDb(url: string) {
  handle = await createDb(url);
  return handle;
}
export function setDbHandle(h: DbHandle) {
  handle = h;
}
export function db(): Db {
  if (!handle) throw new Error("Database not initialised");
  return handle.db;
}
export { schema };
