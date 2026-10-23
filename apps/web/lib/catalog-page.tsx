import Link from "next/link";
import { Suspense } from "react";
import type { Category, ProductListResponse } from "@bayhan/shared";
import { CatalogView } from "@/components/CatalogView";
import { getT } from "@/lib/i18n-server";
import { serverGet } from "@/lib/server-api";

export type SP = Record<string, string | string[] | undefined>;
const KEYS = ["q", "brand", "minPrice", "maxPrice", "inStock", "sort", "page", "specs", "tag"];

export async function CatalogPage({ category, searchParams, search }: { category?: string; searchParams: SP; search?: boolean }) {
  const { locale, t } = await getT();
  const qs = new URLSearchParams();
  for (const k of KEYS) {
    const v = searchParams[k];
    if (typeof v === "string" && v) qs.set(k, v);
  }
  if (category) qs.set("category", category);
  const [data, cats] = await Promise.all([
    serverGet<ProductListResponse>(`/products?${qs}`, locale, 15),
    serverGet<Category[]>("/categories", locale, 120),
  ]);
  const cat = cats?.find((c) => c.slug === category);
  if (!data) return null;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const title = search ? (q ? t("search.results", { q }) : t("search.title")) : cat?.name ?? t("catalog.title");

  return (
    <div className="container">
      <div className="page-head">
        <nav className="crumbs" aria-label="breadcrumbs">
          <Link href="/">{t("nav.home")}</Link> / <Link href="/catalog">{t("nav.catalog")}</Link>
          {cat && <> / <span>{cat.name}</span></>}
        </nav>
        <h1 style={{ fontSize: "clamp(26px,3.4vw,40px)" }}>{title}</h1>
      </div>
      <Suspense>
        <CatalogView
          data={data}
          categories={category ? undefined : (cats ?? []).map((c) => ({ slug: c.slug, name: c.name, count: c.productCount ?? 0 }))}
        />
      </Suspense>
    </div>
  );
}
