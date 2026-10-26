import { catalogRepository } from "@market/data";
import type { Locale } from "@market/contracts";
import { apiError } from "@/lib/api-error";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const locale: Locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ru";
  const product = await catalogRepository.getBySlug(locale, slug, false);
  if (!product) return apiError(404, "NOT_FOUND", "Товар не найден или ещё не опубликован.");
  return Response.json({ product });
}
