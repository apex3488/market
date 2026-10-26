import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);
  if (user.role !== "admin") redirect(`/${locale}/account`);
  const t = await getTranslations("admin");

  return (
    <div className="grid gap-8 py-8">
      <div className="grid gap-2">
        <p className="text-sm text-muted">{t("demo")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin">{t("overview")}</Link>
          <Link href="/admin/products">{t("products")}</Link>
          <Link href="/admin/orders">{t("orders")}</Link>
          <Link href="/admin/promos">{t("promos")}</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
