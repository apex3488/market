import "server-only";
import type { Locale } from "@bayhan/shared";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

/** Server-side catalog fetch (public data only; cached briefly so admin edits show up within a minute). */
export async function serverGet<T>(path: string, locale: Locale, revalidate = 30): Promise<T | null> {
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${API}/api/v1${path}${sep}lang=${locale}`, { next: { revalidate } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    console.error("[serverGet]", path, (e as Error).message);
    throw e;
  }
}
