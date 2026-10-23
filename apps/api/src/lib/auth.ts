import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import type { Locale, User as UserDto } from "@bayhan/shared";
import { db, schema } from "../db/client";
import { isProd } from "../env";
import { randomToken, sha256 } from "./crypto";
import { AppError, forbidden, unauthorized } from "./errors";

export const SESSION_COOKIE = "bm_session";
const SESSION_DAYS = 30;
const REFRESH_WHEN_DAYS_LEFT = 15;
const DAY = 86_400_000;

export type UserRow = typeof schema.users.$inferSelect;

export type AppEnv = {
  Variables: {
    user: UserRow | null;
    sessionId: string | null;
    lang: Locale;
  };
};

export function toUserDto(u: UserRow): UserDto {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    locale: u.locale,
    telegramLinked: u.telegramId != null,
  };
}

export async function createSession(c: Context, userId: string, client: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
  await db().insert(schema.sessions).values({ userId, tokenHash: sha256(token), client, expiresAt });
  if (client === "web") setSessionCookie(c, token, expiresAt);
  return { token, expiresAt };
}

function setSessionCookie(c: Context, token: string, expires: Date) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: "/",
    expires,
  });
}

export async function destroySession(c: Context) {
  const id = c.get("sessionId");
  if (id) await db().delete(schema.sessions).where(eq(schema.sessions.id, id));
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Resolves the current user from a Bearer token (mobile/telegram) or httpOnly cookie (web). */
export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("user", null);
  c.set("sessionId", null);
  const header = c.req.header("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  const cookie = bearer ? null : getCookie(c, SESSION_COOKIE);
  const token = bearer || cookie;

  // CSRF: cookie-authenticated state-changing requests must carry a custom header,
  // which a cross-site form/image cannot set (and CORS blocks for foreign origins).
  if (cookie && !SAFE_METHODS.has(c.req.method) && !c.req.header("x-bm-client")) {
    throw new AppError(403, "csrf", "Missing client header");
  }

  if (token && token.length < 200) {
    const rows = await db()
      .select({ session: schema.sessions, user: schema.users })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
      .where(and(eq(schema.sessions.tokenHash, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
      .limit(1);
    const row = rows[0];
    if (row) {
      c.set("user", row.user);
      c.set("sessionId", row.session.id);
      const left = row.session.expiresAt.getTime() - Date.now();
      if (left < REFRESH_WHEN_DAYS_LEFT * DAY) {
        const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
        await db()
          .update(schema.sessions)
          .set({ expiresAt, lastUsedAt: new Date() })
          .where(eq(schema.sessions.id, row.session.id));
        if (cookie) setSessionCookie(c, token, expiresAt);
      }
    } else if (cookie) {
      deleteCookie(c, SESSION_COOKIE, { path: "/" });
    }
  }
  await next();
};

export function requireUser(c: Context<AppEnv>): UserRow {
  const u = c.get("user");
  if (!u) throw unauthorized();
  return u;
}

export function requireAdmin(c: Context<AppEnv>): UserRow {
  const u = requireUser(c);
  if (u.role !== "admin") throw forbidden();
  return u;
}

export const langMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const q = c.req.query("lang") ?? c.req.header("x-lang") ?? c.req.header("accept-language")?.slice(0, 2);
  c.set("lang", q === "en" ? "en" : "ru");
  await next();
};
