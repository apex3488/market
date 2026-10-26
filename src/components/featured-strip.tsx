import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductCard as ProductCardData } from "@market/data";
import { formatUzs } from "@/lib/format";

export async function FeaturedStrip({
  products,
  locale,
}: {
  products: ProductCardData[];
  locale: string;
}) {
  const t = await getTranslations("product");
  const [lead, ...rest] = products;
  if (!lead) return null;

  return (
    <section className="featured-strip grid gap-5 lg:grid-cols-12 lg:gap-6">
      <Link
        href={`/p/${lead.slug}`}
        className="group relative min-h-[22rem] overflow-hidden rounded-[var(--radius)] border border-line bg-surface lg:col-span-7 lg:min-h-[28rem]"
      >
        <Image
          src={lead.image}
          alt={t("photoAlt", { title: lead.title })}
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-transparent" />
        <div className="relative z-[1] flex h-full min-h-[22rem] flex-col justify-end gap-2 p-6 md:p-8 lg:min-h-[28rem]">
          <p className="text-sm text-muted">{lead.brandName}</p>
          <h2 className="max-w-[16ch] font-serif text-4xl leading-[1.05] text-balance md:text-5xl">{lead.title}</h2>
          <p className="text-lg">
            {t("from")} {formatUzs(locale, lead.priceUzs)}
          </p>
        </div>
      </Link>

      <ul className="grid content-start divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface lg:col-span-5">
        {rest.map((product) => (
          <li key={product.slug}>
            <Link
              href={`/p/${product.slug}`}
              className="grid grid-cols-[5.5rem_1fr] items-center gap-4 p-4 transition-colors hover:bg-raised sm:grid-cols-[6.5rem_1fr]"
            >
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-control)] bg-raised">
                <Image
                  src={product.image}
                  alt={t("photoAlt", { title: product.title })}
                  fill
                  sizes="104px"
                  className="object-cover"
                />
              </div>
              <div className="grid min-w-0 gap-1">
                <p className="text-sm text-muted">{product.brandName}</p>
                <p className="truncate text-base leading-snug">{product.title}</p>
                <p className="text-sm">
                  {t("from")} {formatUzs(locale, product.priceUzs)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
