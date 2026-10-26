import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { orderRepository } from "@market/data";
import { AccountNav } from "@/components/account-nav";
import { formatUzs } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { Link } from "@/i18n/navigation";

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);
  const t = await getTranslations("account");
  const orders = await orderRepository.listByUser(user.id);

  return (
    <div className="grid gap-8">
      <h1 className="page-title">{t("orders")}</h1>
      <AccountNav locale={locale} />
      {orders.length === 0 ? <p className="text-muted">{t("ordersEmpty")}</p> : null}
      <ul className="grid gap-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/account/orders/${order.id}`} className="card block p-4">
              <p>{order.number}</p>
              <p className="text-sm text-muted">
                {order.status} · {formatUzs(locale, order.totalUzs)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
