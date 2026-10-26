import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { orderRepository } from "@market/data";
import { updateOrderStatusAction } from "@/lib/admin-actions";
import { formatUzs } from "@/lib/format";

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, id } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const order = await orderRepository.getById(id);
  if (!order) notFound();

  return (
    <div className="grid max-w-2xl gap-6">
      <h2 className="text-2xl tracking-tight">{order.number}</h2>
      {error === "status" ? <p className="text-danger">{t("statusError")}</p> : null}
      <p>
        {t("colStatus")}: {order.status}
      </p>
      <p>{order.contact}</p>
      {order.address ? (
        <p className="text-sm text-muted">
          {order.address.recipient}, {order.address.phone}, {order.address.city}, {order.address.street}
        </p>
      ) : null}
      <ul className="grid gap-2 border border-line bg-surface p-4">
        {order.items.map((item) => (
          <li key={item.variantId} className="flex justify-between gap-4 text-sm">
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>{formatUzs(locale, item.lineTotalUzs)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-line pt-2">
          <span>{t("total")}</span>
          <span>{formatUzs(locale, order.totalUzs)}</span>
        </li>
      </ul>
      <section className="grid gap-2">
        <h3 className="text-lg">{t("events")}</h3>
        <ul className="grid gap-1 text-sm text-muted">
          {order.events.map((event, index) => (
            <li key={`${event.at}-${index}`}>
              {event.at}: {event.status} {event.note ? `(${event.note})` : ""}
            </li>
          ))}
        </ul>
      </section>
      <form action={updateOrderStatusAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="orderId" value={order.id} />
        <label className="grid gap-1 text-sm text-muted">
          {t("colStatus")}
          <select className="field" name="status" defaultValue="confirmed">
            <option value="confirmed">confirmed</option>
            <option value="shipped">shipped</option>
            <option value="delivered">delivered</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm text-muted">
          {t("note")}
          <input className="field" name="note" />
        </label>
        <button type="submit" className="btn">
          {t("save")}
        </button>
      </form>
    </div>
  );
}
