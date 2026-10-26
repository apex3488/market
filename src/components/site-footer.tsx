import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CategoryView } from "@market/data";
import { DemoDialog } from "./demo-dialog";

const service = ["about", "delivery", "warranty", "returns", "faq", "contacts"] as const;

export async function SiteFooter({ categories }: { categories: CategoryView[] }) {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <p className="brand-mark text-[2.5rem]">Velin</p>
          <p className="max-w-sm text-muted">{t("note")}</p>
          <DemoDialog />
        </div>
        <nav className="grid content-start gap-2" aria-label={t("shop")}>
          <p>{t("shop")}</p>
          {categories.map((category) => (
            <Link key={category.slug} href={`/c/${category.slug}`} className="text-muted">
              {category.name}
            </Link>
          ))}
        </nav>
        <nav className="grid content-start gap-2" aria-label={t("service")}>
          <p>{t("service")}</p>
          {service.map((slug) => (
            <Link key={slug} href={`/info/${slug}`} className="text-muted">
              {t(slug)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
