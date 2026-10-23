import { Hono } from "hono";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { forgotSchema, loginSchema, profileSchema, registerSchema, resetSchema } from "@bayhan/shared";
import { db, schema } from "../db/client";
import { env } from "../env";
import { createSession, destroySession, requireUser, toUserDto, type AppEnv } from "../lib/auth";
import { hashPassword, randomToken, sha256, verifyPassword } from "../lib/crypto";
import { AppError, jsonBody, parse } from "../lib/errors";
import { rateLimit } from "../lib/rate-limit";
import { mergeGuestCart } from "../services/cart";
import { sendMail } from "../services/mailer";

const s = schema;
export const authRoutes = new Hono<AppEnv>();

const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, key: "auth" });
const clientOf = (h?: string) => (h === "mobile" || h === "telegram" ? h : "web");

function normalizeIdentifier(raw: string) {
  const v = raw.trim().toLowerCase();
  if (v.includes("@")) return { email: v };
  return { phone: v.replace(/[\s()-]/g, "") };
}

authRoutes.post("/register", authLimiter, async (c) => {
  const input = parse(registerSchema, await jsonBody(c));
  const conds = [input.email ? eq(s.users.email, input.email) : undefined, input.phone ? eq(s.users.phone, input.phone) : undefined].filter(Boolean);
  const exists = await db().select({ id: s.users.id }).from(s.users).where(or(...conds)).limit(1);
  if (exists.length) throw new AppError(409, "user_exists", "User already exists");
  const [user] = await db().insert(s.users).values({
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    passwordHash: await hashPassword(input.password),
    locale: input.locale ?? c.get("lang"),
  }).returning();
  await mergeGuestCart(input.cartToken, user!.id);
  const session = await createSession(c, user!.id, clientOf(c.req.header("x-bm-client")));
  return c.json({ user: toUserDto(user!), token: session.token, expiresAt: session.expiresAt.toISOString() }, 201);
});

authRoutes.post("/login", authLimiter, async (c) => {
  const input = parse(loginSchema, await jsonBody(c));
  const id = normalizeIdentifier(input.identifier);
  const user = (await db().select().from(s.users)
    .where(id.email ? eq(s.users.email, id.email) : eq(s.users.phone, id.phone!)).limit(1))[0];
  const ok = await verifyPassword(input.password, user?.passwordHash ?? null);
  if (!user || !ok) throw new AppError(401, "invalid_credentials", "Invalid credentials");
  await mergeGuestCart(input.cartToken, user.id);
  const session = await createSession(c, user.id, clientOf(c.req.header("x-bm-client")));
  return c.json({ user: toUserDto(user), token: session.token, expiresAt: session.expiresAt.toISOString() });
});

authRoutes.post("/logout", async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});

authRoutes.get("/me", (c) => {
  const u = c.get("user");
  return c.json({ user: u ? toUserDto(u) : null });
});

authRoutes.patch("/me", async (c) => {
  const user = requireUser(c);
  const input = parse(profileSchema, await jsonBody(c));
  const [u] = await db().update(s.users).set({ ...input, updatedAt: new Date() }).where(eq(s.users.id, user.id)).returning();
  return c.json({ user: toUserDto(u!) });
});

authRoutes.post("/password/forgot", rateLimit({ windowMs: 60 * 60_000, max: 5, key: "forgot" }), async (c) => {
  const input = parse(forgotSchema, await jsonBody(c));
  const id = normalizeIdentifier(input.identifier);
  const user = (await db().select().from(s.users)
    .where(id.email ? eq(s.users.email, id.email) : eq(s.users.phone, id.phone!)).limit(1))[0];
  // Same response whether or not the account exists (no user enumeration).
  if (user?.email) {
    const token = randomToken(32);
    await db().insert(s.passwordResets).values({ userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60_000) });
    const link = `${env.WEB_URL}/reset-password?token=${token}`;
    const ru = (input.locale ?? user.locale) === "ru";
    await sendMail(
      user.email,
      ru ? "Восстановление пароля BAYHAN MARKET" : "BAYHAN MARKET password reset",
      ru ? `Чтобы задать новый пароль, перейдите по ссылке (действует 1 час):\n${link}` : `Use this link to set a new password (valid for 1 hour):\n${link}`,
    );
  }
  return c.json({ ok: true });
});

authRoutes.post("/password/reset", authLimiter, async (c) => {
  const input = parse(resetSchema, await jsonBody(c));
  const row = (await db().select().from(s.passwordResets).where(and(
    eq(s.passwordResets.tokenHash, sha256(input.token)),
    isNull(s.passwordResets.usedAt),
    gt(s.passwordResets.expiresAt, new Date()),
  )).limit(1))[0];
  if (!row) throw new AppError(400, "token_invalid", "Token invalid or expired");
  const hash = await hashPassword(input.password);
  await db().transaction(async (tx) => {
    await tx.update(s.passwordResets).set({ usedAt: new Date() }).where(eq(s.passwordResets.id, row.id));
    await tx.update(s.users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(s.users.id, row.userId));
    await tx.delete(s.sessions).where(eq(s.sessions.userId, row.userId)); // sign out everywhere
  });
  return c.json({ ok: true });
});
