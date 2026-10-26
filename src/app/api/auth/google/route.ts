import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import {
  GOOGLE_STATE_COOKIE,
  createPkce,
  googleRedirectUri,
  isGoogleConfigured,
} from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("locale") ?? "";
  const locale = (routing.locales as readonly string[]).includes(requested)
    ? requested
    : routing.defaultLocale;
  const origin = request.nextUrl.origin;

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL(`/${locale}/account/login?error=google`, origin));
  }

  const state = randomBytes(16).toString("base64url");
  const { verifier, challenge } = createPkce();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, verifier, locale }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth/google",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
  });
  return response;
}
