import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CategoryView, ProfileView } from "@market/data";
import { getCartItemCount } from "@/lib/cart";
import { CatalogNav } from "./catalog-nav";
import { LocaleSwitch } from "./locale-switch";
import { MobileMenu } from "./mobile-menu";
import { SearchField } from "./search-field";

export async function SiteHeader({
  locale,
  categories,
  user,
}: {
  locale: string;
  categories: CategoryView[];
  user: ProfileView | null;
}) {
  const t = await getTranslations("nav");
  const cartCount = await getCartItemCount();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="brand-mark">
          Velin
        </Link>
        <CatalogNav categories={categories} />
        <div className="hidden min-w-0 flex-1 md:flex">
          <SearchField locale={locale} />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/cart" className="inline-flex min-h-11 items-center px-2">
            {t("cart")}
            {cartCount > 0 ? <span className="ml-1 text-muted">({cartCount})</span> : null}
          </Link>
          <Link href={user ? "/account" : "/account/login"} className="hidden min-h-11 items-center px-2 md:inline-flex">
            {user ? user.displayName : t("account")}
          </Link>
          {user?.role === "admin" ? (
            <Link href="/admin" className="hidden min-h-11 items-center px-2 md:inline-flex">
              {t("admin")}
            </Link>
          ) : null}
          <LocaleSwitch />
          <MobileMenu locale={locale} categories={categories} />
        </div>
      </div>
    </header>
  );
}
