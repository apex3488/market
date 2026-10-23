import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { img, type ProductCard as P, type ProductDetail } from "@bayhan/shared";
import { ProductCard } from "@/components/ProductCard";
import { ProductView } from "@/components/ProductView";
import { Reveal } from "@/components/Reveal";
import { getT } from "@/lib/i18n-server";
import { serverGet } from "@/lib/server-api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await getT();
  const p = await serverGet<ProductDetail>(`/products/${encodeURIComponent((await params).slug)}`, locale);
  if (!p) return {};
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    openGraph: { title: p.name, description: p.description.slice(0, 160), images: p.image ? [img(p.image, 1200)] : [] },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { locale, t } = await getT();
  const [p, related] = await Promise.all([
    serverGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`, locale),
    serverGet<P[]>(`/products/${encodeURIComponent(slug)}/related`, locale),
  ]);
  if (!p) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images.map((i) => img(i.url, 1200)),
    description: p.description,
    brand: { "@type": "Brand", name: p.brand.name },
    offers: {
      "@type": "Offer",
      price: (p.price / 100).toFixed(2),
      priceCurrency: p.currency,
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="page-head" style={{ paddingBottom: 10 }}>
        <nav className="crumbs" aria-label="breadcrumbs">
          <Link href="/">{t("nav.home")}</Link> / <Link href="/catalog">{t("nav.catalog")}</Link> /{" "}
          <Link href={`/catalog/${p.category.slug}`}>{p.category.name}</Link> / <span>{p.name}</span>
        </nav>
      </div>
      <ProductView p={p} />
      {related && related.length > 0 && (
        <section className="section">
          <Reveal>
            <div className="section-head"><h2>{t("product.related")}</h2></div>
            <div className="scroller">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
          </Reveal>
        </section>
      )}
    </div>
  );
}
