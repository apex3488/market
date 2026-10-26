import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { userRepository, type ProfileView } from "@market/data";

export const SESSION_COOKIE = "velin_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/** Cookie payload. Google users carry their profile so a fresh serverless instance can restore them. */
type SessionPayload = {
  uid: string;
  email?: string;
  name?: string;
  picture?: string | null;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set");
  return "velin-dev-secret";
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    return typeof payload.uid === "string" ? payload : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE,
};

export async function setSession(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(payload), sessionCookieOptions);
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value)?.uid ?? null;
}

export async function getSessionUser(): Promise<ProfileView | null> {
  const store = await cookies();
  const session = decodeSession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  let user = await userRepository.findById(session.uid);
  if (!user && session.email) {
    user = await userRepository.upsertOAuthUser({
      id: session.uid,
      email: session.email,
      displayName: session.name ?? "",
      avatarPath: session.picture ?? null,
    });
  }
  return user ? userRepository.toProfile(user) : null;
}

export async function requireSessionUser(): Promise<ProfileView> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdminUser(): Promise<ProfileView> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
