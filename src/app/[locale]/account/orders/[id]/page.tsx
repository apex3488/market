import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { orderRepository } from "@market/data";
import { AccountNav } from "@/components/account-nav";
import { formatUzs } from "@/lib/format";
import { getSessionUser } from "@/lib/session";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);
  const order = await orderRepository.getForUser(user.id, id);
  if (!order) notFound();
  const t = await getTranslations("account");

  return (
    <div className="grid gap-8">
      <h1 className="page-title">{order.number}</h1>
      <AccountNav locale={locale} />
      <p className="text-muted">
        {t("status")}: {order.status}
      </p>
      <ul className="grid gap-2">
        {order.items.map((item) => (
          <li key={item.variantId} className="flex justify-between gap-4 border-b border-line py-2">
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>{formatUzs(locale, item.lineTotalUzs)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xl">{formatUzs(locale, order.totalUzs)}</p>
    </div>
  );
}
