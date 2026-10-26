import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { logoutAction } from "@/lib/auth-actions";

const links = ["", "profile", "orders", "addresses", "favorites"] as const;

export async function AccountNav({ locale }: { locale: string }) {
  const t = await getTranslations("account");
  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("title")}>
      {links.map((slug) => (
        <Link key={slug || "home"} href={slug ? `/account/${slug}` : "/account"} className="btn btn-ghost">
          {t(slug || "overview")}
        </Link>
      ))}
      <form action={logoutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="btn btn-ghost">
          {t("logout")}
        </button>
      </form>
    </nav>
  );
}
