import "server-only";
import type { Locale } from "@bayhan/shared";

const API = process.env.API_INTERNAL_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:4000" : undefined);

/** Server-side catalog fetch (public data only). */
export async function serverGet<T>(path: string, locale: Locale, revalidate = 30): Promise<T | null> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `/api/v1${path}${sep}lang=${locale}`;
  try {
    let res: Response;
    if (API) {
      // separate API server (local dev)
      res = await fetch(`${API}${url}`, { next: { revalidate } });
    } else {
      // API embedded in this Next.js server (Vercel): call it in-process, no network hop
      const { getApp } = await import("@bayhan/api/embedded");
      res = await (await getApp()).request(url);
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    console.error("[serverGet]", path, (e as Error).message);
    throw e;
  }
}
