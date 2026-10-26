import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { catalogRepository } from "@market/data";
import { Bento } from "@/components/bento";
import { FeaturedStrip } from "@/components/featured-strip";
import { PasList } from "@/components/pas-list";
import { Button } from "@/components/ui";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hero");
  const categories = await catalogRepository.listCategories(locale as "ru" | "en");
  const products = await catalogRepository.listProducts(locale as "ru" | "en", {
    sort: "new",
    includeDrafts: false,
    page: 1,
    pageSize: 48,
  });
  const promos = await catalogRepository.listPromos(locale as "ru" | "en");
  const featured = products.filter((product) => product.featured).slice(-4).reverse();

  return (
    <div className="grid gap-20 pt-8 pb-12">
      <section className="relative grid items-end gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-4 -top-8 h-[28rem] bg-[radial-gradient(ellipse_at_20%_0%,oklch(0.55_0.01_250/0.18),transparent_55%)]"
        />
        <div className="relative grid max-w-xl content-start gap-6">
          <h1 className="hero-title font-serif text-[clamp(2.6rem,6vw,4.75rem)] leading-[1.05] text-balance">
            {t("title")}
          </h1>
          <p className="max-w-[34rem] text-lg text-muted">{t("text")}</p>
          <div>
            <Button href="/c/telefony">{t("cta")}</Button>
          </div>
        </div>
        <div className="relative min-h-[22rem] overflow-hidden rounded-[var(--radius)] border border-line bg-surface lg:min-h-[34rem]">
          <Image
            src="/demo/phone.jpg"
            alt={t("imageAlt")}
            fill
            preload
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>
      <Bento categories={categories} />
      <FeaturedStrip products={featured} locale={locale} />
      <PasList promos={promos} />
    </div>
  );
}
