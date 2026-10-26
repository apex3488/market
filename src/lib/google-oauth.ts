import { createHash, randomBytes } from "node:crypto";

export const GOOGLE_STATE_COOKIE = "velin_google_state";

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(origin: string): string {
  return `${process.env.AUTH_URL ?? origin}/api/auth/google/callback`;
}

export function createPkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function exchangeGoogleCode(input: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<GoogleProfile> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
      code_verifier: input.verifier,
    }),
  });
  if (!tokenResponse.ok) {
    const body = (await tokenResponse.json().catch(() => ({}))) as { error?: string; error_description?: string };
    throw new Error(`GOOGLE_TOKEN_FAILED ${tokenResponse.status} ${body.error ?? ""} ${body.error_description ?? ""}`);
  }
  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!accessToken) throw new Error("GOOGLE_TOKEN_FAILED");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) throw new Error(`GOOGLE_PROFILE_FAILED ${profileResponse.status}`);
  return (await profileResponse.json()) as GoogleProfile;
}
