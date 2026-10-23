import type { SQL } from "drizzle-orm";
import { db, type Db, type Tx } from "../db/client";

/** Run raw SQL and return rows regardless of driver (postgres.js returns an array, PGlite returns {rows}). */
export async function rawRows<T = Record<string, unknown>>(q: SQL, dbx: Db | Tx = db()): Promise<T[]> {
  const r = (await dbx.execute(q)) as unknown;
  if (Array.isArray(r)) return r as T[];
  return ((r as { rows?: T[] }).rows ?? []) as T[];
}

export const num = (v: unknown) => (v == null ? 0 : Number(v));
