import { NextResponse, type NextRequest } from "next/server";
import { userRepository } from "@market/data";
import { routing } from "@/i18n/routing";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { GOOGLE_STATE_COOKIE, exchangeGoogleCode, googleRedirectUri } from "@/lib/google-oauth";
import { SESSION_COOKIE, encodeSession, sessionCookieOptions } from "@/lib/session";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  let saved: { state?: string; verifier?: string; locale?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "{}");
  } catch {}
  const locale = saved.locale ?? routing.defaultLocale;
  const fail = (reason: string) => {
    console.error(`[google-callback] ${reason}`);
    const response = NextResponse.redirect(new URL(`/${locale}/account/login?error=google`, origin));
    response.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
    return response;
  };

  const code = params.get("code");
  if (params.get("error")) return fail(`google returned error=${params.get("error")}`);
  if (!saved.state || !saved.verifier) return fail("state cookie missing");
  if (!code || params.get("state") !== saved.state) return fail("code missing or state mismatch");

  let session: string;
  try {
    const profile = await exchangeGoogleCode({
      code,
      verifier: saved.verifier,
      redirectUri: googleRedirectUri(origin),
    });
    if (!profile.email || !profile.email_verified) return fail("email missing or not verified");

    const user = await userRepository.upsertOAuthUser({
      id: `google-${profile.sub}`,
      email: profile.email,
      displayName: profile.name ?? "",
      avatarPath: profile.picture ?? null,
    });
    session = encodeSession({
      uid: user.id,
      email: user.email,
      name: user.displayName,
      picture: user.avatarPath,
    });
    await mergeGuestCartIntoUser(user.id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const response = NextResponse.redirect(new URL(`/${locale}/account`, origin));
  response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions);
  response.cookies.delete({ name: GOOGLE_STATE_COOKIE, path: "/api/auth/google" });
  return response;
}
