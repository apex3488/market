import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { catalogRepository, userRepository } from "@market/data";
import { AccountNav } from "@/components/account-nav";
import { ProductCard } from "@/components/product-card";
import { getSessionUser } from "@/lib/session";

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);
  const t = await getTranslations("account");
  const slugs = await userRepository.listFavorites(user.id);
  const products = await catalogRepository.getBySlugs(locale as "ru" | "en", slugs);

  return (
    <div className="grid gap-8">
      <h1 className="page-title">{t("favorites")}</h1>
      <AccountNav locale={locale} />
      {products.length === 0 ? <p className="text-muted">{t("favoritesEmpty")}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} locale={locale} />
        ))}
      </div>
    </div>
  );
}
