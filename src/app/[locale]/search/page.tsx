import { getTranslations, setRequestLocale } from "next-intl/server";
import { catalogRepository } from "@market/data";
import { ProductCard } from "@/components/product-card";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("search");
  const query = q.trim();
  const products = query
    ? await catalogRepository.listProducts(locale as "ru" | "en", {
        q: query,
        sort: "new",
        includeDrafts: false,
        page: 1,
        pageSize: 24,
      })
    : [];
  const suggestions =
    query && products.length === 0
      ? await catalogRepository.suggest(locale as "ru" | "en", query.slice(0, 3))
      : [];

  return (
    <div className="grid gap-8 py-8">
      <h1 className="page-title">{t("title")}</h1>
      {!query ? <p className="text-muted">{t("prompt")}</p> : null}
      {query && products.length === 0 ? (
        <div className="grid gap-3">
          <p>{t("empty", { query })}</p>
          {suggestions.length > 0 ? (
            <p className="text-muted">
              {t("try")}: {suggestions.map((item) => item.title).join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} locale={locale} />
        ))}
      </div>
    </div>
  );
}
