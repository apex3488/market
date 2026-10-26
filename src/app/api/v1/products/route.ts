import { parseProductQuery } from "@market/contracts";
import { catalogRepository } from "@market/data";
import type { Locale } from "@market/contracts";
import { apiError } from "@/lib/api-error";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale: Locale = url.searchParams.get("locale") === "en" ? "en" : "ru";
  const parsed = parseProductQuery({
    category: url.searchParams.get("category") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    inStock: url.searchParams.get("inStock") === "1" ? true : undefined,
    includeDrafts: false,
  });
  if (!parsed.success) {
    return apiError(400, "INVALID_QUERY", "Проверьте sort, page и pageSize.");
  }
  const page = await catalogRepository.listProductsPage(locale, parsed.data);
  return Response.json({ products: page.items, page });
}
