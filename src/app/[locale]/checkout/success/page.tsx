import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { orderRepository } from "@market/data";
import { formatUzs } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { Link } from "@/i18n/navigation";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  const { order: orderId } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  if (!orderId) redirect(`/${locale}/cart`);
  const user = await getSessionUser();
  const order = user
    ? await orderRepository.getForUser(user.id, orderId)
    : await orderRepository.getById(orderId);
  if (!order) redirect(`/${locale}/cart`);
  if (!user && order.userId) redirect(`/${locale}/account/login`);

  return (
    <div className="mx-auto grid max-w-xl gap-6 py-8">
      <h1 className="page-title">{t("successTitle")}</h1>
      <p className="text-muted">{t("successText", { number: order.number })}</p>
      <p>
        {t("total")}: {formatUzs(locale, order.totalUzs)}
      </p>
      <p className="text-sm text-muted">{t("status")}: {order.status}</p>
      <div className="flex flex-wrap gap-3">
        {user ? (
          <Link href={`/account/orders/${order.id}`} className="btn">
            {t("openOrder")}
          </Link>
        ) : null}
        <Link href="/" className="btn btn-ghost">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
