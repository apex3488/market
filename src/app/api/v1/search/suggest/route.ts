import { catalogRepository } from "@market/data";
import type { Locale } from "@market/contracts";
import { apiError } from "@/lib/api-error";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length > 80) return apiError(400, "INVALID_QUERY", "Запрос длиннее 80 символов.");
  const locale: Locale = url.searchParams.get("locale") === "en" ? "en" : "ru";
  const suggestions = q ? await catalogRepository.suggest(locale, q) : [];
  return Response.json({ suggestions });
}
