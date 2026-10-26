import { getTranslations, setRequestLocale } from "next-intl/server";
import { adminRepository, orderRepository } from "@market/data";
import { Link } from "@/i18n/navigation";

export default async function AdminHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const products = await adminRepository.listProducts();
  const orders = await orderRepository.listAll();
  const drafts = products.filter((item) => item.status === "draft").length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link href="/admin/products" className="border border-line bg-surface p-5">
        <p className="text-sm text-muted">{t("products")}</p>
        <p className="text-3xl">{products.length}</p>
        <p className="text-sm text-muted">
          {t("drafts")}: {drafts}
        </p>
      </Link>
      <Link href="/admin/orders" className="border border-line bg-surface p-5">
        <p className="text-sm text-muted">{t("orders")}</p>
        <p className="text-3xl">{orders.length}</p>
      </Link>
      <Link href="/admin/promos" className="border border-line bg-surface p-5">
        <p className="text-sm text-muted">{t("promos")}</p>
        <p className="text-3xl">3</p>
      </Link>
    </div>
  );
}
