import { catalogRepository } from "@market/data";
import type { Locale } from "@market/contracts";

function localeOf(request: Request): Locale {
  return new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ru";
}

export async function GET(request: Request) {
  const categories = await catalogRepository.listCategories(localeOf(request));
  return Response.json({ categories });
}
