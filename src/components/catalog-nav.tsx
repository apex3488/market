import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CategoryView } from "@market/data";

export function CatalogNav({ categories }: { categories: CategoryView[] }) {
  const t = useTranslations("nav");

  return (
    <>
      <button type="button" className="hidden min-h-11 items-center px-2 md:inline-flex" popoverTarget="catalog-nav">
        {t("catalog")}
      </button>
      <div id="catalog-nav" popover="auto" className="catalog-pop">
        {categories.map((category) => (
          <div key={category.slug} className="grid gap-1">
            <Link href={`/c/${category.slug}`} className="min-h-11 py-1">
              {category.name}
            </Link>
            {category.children.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pb-2">
                {category.children.map((child) => (
                  <Link key={child.slug} href={`/c/${child.slug}`} className="text-sm text-muted">
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
