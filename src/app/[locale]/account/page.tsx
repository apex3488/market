import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getSessionUser } from "@/lib/session";
import { Link } from "@/i18n/navigation";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verified?: string }>;
}) {
  const { locale } = await params;
  const { verified } = await searchParams;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);
  const t = await getTranslations("account");

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="page-title">{t("title")}</h1>
        <p className="text-muted">
          {user.displayName} · {user.email}
        </p>
        {verified ? <p className="text-success">{t("verifiedOk")}</p> : null}
        {!user.emailVerified ? <p className="text-muted">{t("verifyHint")}</p> : null}
      </div>
      <AccountNav locale={locale} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/account/orders", label: t("orders") },
          { href: "/account/addresses", label: t("addresses") },
          { href: "/account/favorites", label: t("favorites") },
          { href: "/account/profile", label: t("profile") },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="card p-5">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
