import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { parseProductQuery } from "@market/contracts";
import { catalogRepository } from "@market/data";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogFilters } from "@/components/catalog-filters";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { Link } from "@/i18n/navigation";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ sort?: string; brand?: string; inStock?: string; page?: string }>;
}) {
  const { locale, slug } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const tNav = await getTranslations("nav");
  const category = await catalogRepository.getCategory(locale as "ru" | "en", slug);
  if (!category) notFound();
  const brands = await catalogRepository.listBrands();
  const parsed = parseProductQuery({
    category: slug,
    brand: query.brand || undefined,
    sort: query.sort,
    includeDrafts: false,
    page: query.page ?? "1",
    pageSize: "12",
    inStock: query.inStock === "1" ? true : undefined,
  });
  if (!parsed.success) notFound();
  const brand = parsed.data.brand;
  const sort = parsed.data.sort;
  const inStock = parsed.data.inStock;
  const pageData = await catalogRepository.listProductsPage(locale as "ru" | "en", parsed.data);
  const crumbs = [
    { href: "/", label: tNav("home") },
    ...(category.parentSlug
      ? [
          {
            href: `/c/${category.parentSlug}`,
            label:
              (await catalogRepository.getCategory(locale as "ru" | "en", category.parentSlug))?.name ??
              category.parentSlug,
          },
        ]
      : []),
    { label: category.name },
  ];

  function hrefFor(page: number) {
    const next = new URLSearchParams();
    if (brand) next.set("brand", brand);
    if (sort && sort !== "new") next.set("sort", sort);
    if (inStock) next.set("inStock", "1");
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    return qs ? `/c/${slug}?${qs}` : `/c/${slug}`;
  }

  return (
    <div className="grid gap-8 py-8">
      <Breadcrumbs items={crumbs} />
      <div className="grid gap-2">
        <h1 className="page-title">{category.name}</h1>
        <p className="text-muted">{category.description}</p>
        <p className="text-muted">{t("count", { count: pageData.total })}</p>
      </div>
      {category.children.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {category.children.map((child) => (
            <Link key={child.slug} href={`/c/${child.slug}`} className="btn btn-ghost">
              {child.name}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <CatalogFilters
          brand={brand ?? ""}
          brands={brands.map((entry) => ({ value: entry.id, label: entry.name }))}
          inStock={Boolean(inStock)}
          sort={sort}
          labels={{
            brand: t("brand"),
            allBrands: t("allBrands"),
            sort: t("sort"),
            sortNew: t("sortNew"),
            sortAsc: t("sortAsc"),
            sortDesc: t("sortDesc"),
            inStock: t("inStock"),
          }}
        />
        <div className="grid gap-6">
          {pageData.items.length === 0 ? (
            <p>{t("empty")}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageData.items.map((product) => (
                <ProductCard key={product.slug} product={product} locale={locale} />
              ))}
            </div>
          )}
          <Pagination
            page={pageData.page}
            pageCount={pageData.pageCount}
            makeHref={hrefFor}
            labels={{ prev: t("prev"), next: t("next"), page: t("page") }}
          />
        </div>
      </div>
    </div>
  );
}
