import { eq } from "drizzle-orm";
import { createDb, schema } from "../db/client";
import { env } from "../env";
import { hashPassword } from "../lib/crypto";

/**
 * Creates or promotes an administrator.
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create
 */
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 10) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 chars).");
  process.exit(1);
}
const handle = await createDb(env.DATABASE_URL);
const db = handle.db;
const existing = (await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1))[0];
const passwordHash = await hashPassword(password);
if (existing) {
  await db.update(schema.users).set({ role: "admin", passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, existing.id));
  console.log(`User ${email} promoted to admin.`);
} else {
  await db.insert(schema.users).values({ email, name: "Administrator", role: "admin", passwordHash });
  console.log(`Admin ${email} created.`);
}
await handle.close();
