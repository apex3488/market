import { getTranslations, setRequestLocale } from "next-intl/server";
import { orderRepository } from "@market/data";
import { formatUzs } from "@/lib/format";
import { Link } from "@/i18n/navigation";

export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const orders = await orderRepository.listAll();

  return (
    <div className="grid gap-4">
      <h2 className="text-2xl tracking-tight">{t("orders")}</h2>
      {orders.length === 0 ? <p className="text-muted">{t("ordersEmpty")}</p> : null}
      <ul className="grid gap-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/admin/orders/${order.id}`} className="card block p-4">
              <p>{order.number}</p>
              <p className="text-sm text-muted">
                {order.status} · {formatUzs(locale, order.totalUzs)} · {order.contact}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
