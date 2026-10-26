import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { catalogRepository } from "@market/data";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompareToggle } from "@/components/compare-toggle";
import { JsonLd } from "@/components/json-ld";
import { Badge } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { toggleFavoriteAction } from "@/lib/auth-actions";
import { addToCartAction } from "@/lib/cart-actions";
import { formatUzs } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { userRepository } from "@market/data";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("product");
  const tNav = await getTranslations("nav");
  const product = await catalogRepository.getBySlug(locale as "ru" | "en", slug);
  if (!product) notFound();
  const category = await catalogRepository.getCategory(locale as "ru" | "en", product.categorySlug);
  const user = await getSessionUser();
  const favoriteSlugs = user ? await userRepository.listFavorites(user.id) : [];
  const isFavorite = favoriteSlugs.includes(product.slug);
  const defaultVariant = product.variants[0];

  return (
    <article className="grid gap-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.description,
          image: product.image,
          brand: product.brandName,
          offers: {
            "@type": "Offer",
            priceCurrency: "UZS",
            price: product.priceUzs,
            availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: tNav("home") },
          { href: `/c/${product.categorySlug}`, label: category?.name ?? product.categorySlug },
          { label: product.title },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="grid gap-3">
          <div className="relative min-h-[22rem] overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
            <Image
              src={product.image}
              alt={t("photoAlt", { title: product.title })}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[product.image, product.image, product.image].map((src, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface">
                <Image src={src} alt="" fill sizes="160px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-5">
          <p className="text-muted">{product.brandName}</p>
          <h1 className="page-title text-balance">{product.title}</h1>
          <p className="max-w-xl text-muted">{product.description}</p>
          <p className="text-2xl">
            {t("from")} {formatUzs(locale, product.priceUzs)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>{t("demoPrice")}</Badge>
            <Badge tone={product.stockQuantity > 0 ? "ok" : "no"}>
              {product.stockQuantity > 0 ? t("inStock") : t("outOfStock")}
            </Badge>
          </div>
          <section className="grid gap-2">
            <h2 className="text-lg">{t("variants")}</h2>
            <ul className="grid gap-2">
              {product.variants.map((variant) => (
                <li key={variant.id} className="flex min-h-11 items-center justify-between gap-4 border-b border-line py-2">
                  <span>
                    {variant.label}
                    <span className="mt-1 block text-sm text-muted">{variant.sku}</span>
                  </span>
                  <span>{formatUzs(locale, variant.priceUzs)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="grid gap-2">
            <h2 className="text-lg">{t("specs")}</h2>
            <dl className="grid gap-2">
              {product.specs.map((spec) => (
                <div key={spec.label} className="grid gap-1">
                  <dt className="text-sm text-muted">{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="text-sm text-muted">{t("delivery")}</p>
          <p className="text-sm text-muted">{t("warranty")}</p>
          {defaultVariant && product.stockQuantity > 0 ? (
            <form action={addToCartAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="locale" value={locale} />
              <label className="grid gap-2 text-sm text-muted">
                {t("variants")}
                <select className="field min-w-[12rem]" name="variantId" defaultValue={defaultVariant.id}>
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id} disabled={variant.stockQuantity <= 0}>
                      {variant.label} - {formatUzs(locale, variant.priceUzs)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-muted">
                {t("qty")}
                <input className="field w-24" type="number" name="quantity" min={1} defaultValue={1} />
              </label>
              <button type="submit" className="btn">
                {t("addToCart")}
              </button>
            </form>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <CompareToggle slug={product.slug} categorySlug={product.categorySlug} />
            {user ? (
              <form action={toggleFavoriteAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="slug" value={product.slug} />
                <input type="hidden" name="back" value={`/${locale}/p/${product.slug}`} />
                <button type="submit" className="btn btn-ghost">
                  {isFavorite ? t("favoriteOn") : t("favorite")}
                </button>
              </form>
            ) : (
              <Link href="/account/login" className="btn btn-ghost">
                {t("favoriteLogin")}
              </Link>
            )}
          </div>
          <Link href={`/c/${product.categorySlug}`} className="text-muted">
            {t("back")}
          </Link>
        </div>
      </div>
    </article>
  );
}
