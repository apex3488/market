import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export function createDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Create a Neon project and put the URL in the server env.");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
export { schema };
