import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { cartRepository, userRepository } from "@market/data";
import { checkoutAction } from "@/lib/cart-actions";
import { peekCartOwnerKey } from "@/lib/cart";
import { formatUzs } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { Link } from "@/i18n/navigation";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const user = await getSessionUser();
  const ownerKey = await peekCartOwnerKey();
  const cart = await cartRepository.get(ownerKey);
  if (cart.items.length === 0) redirect(`/${locale}/cart?error=empty`);
  const addresses = user ? await userRepository.listAddresses(user.id) : [];
  const preferred = addresses.find((item) => item.isDefault) ?? addresses[0];
  const idempotencyKey = `chk-${ownerKey}-${cart.items.map((item) => `${item.variantId}:${item.quantity}`).join("-")}`;

  return (
    <div className="mx-auto grid max-w-2xl gap-8 py-8">
      <h1 className="page-title">{t("title")}</h1>
      <p className="text-muted">{t("demoNote")}</p>
      {error === "fields" ? <p className="text-danger">{t("errorFields")}</p> : null}
      {error === "stock" ? <p className="text-danger">{t("errorStock")}</p> : null}
      {error === "order" ? <p className="text-danger">{t("errorOrder")}</p> : null}
      <ul className="grid gap-2 border border-line bg-surface p-4">
        {cart.items.map((item) => (
          <li key={item.variantId} className="flex justify-between gap-4 text-sm">
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>{formatUzs(locale, item.lineTotalUzs)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-line pt-2 text-base">
          <span>{t("total")}</span>
          <span>{formatUzs(locale, cart.totalUzs)}</span>
        </li>
      </ul>
      <form action={checkoutAction} className="grid gap-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <label className="grid gap-2 text-sm text-muted">
          {t("contact")}
          <input className="field" name="contact" type="email" required defaultValue={user?.email ?? ""} />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          {t("recipient")}
          <input className="field" name="recipient" required defaultValue={preferred?.recipient ?? user?.displayName ?? ""} />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          {t("phone")}
          <input className="field" name="phone" required defaultValue={preferred?.phone ?? user?.phone ?? ""} />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          {t("city")}
          <input className="field" name="city" required defaultValue={preferred?.city ?? ""} />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          {t("street")}
          <input className="field" name="street" required defaultValue={preferred?.street ?? ""} />
        </label>
        <p className="rounded-[var(--radius-control)] border border-line bg-raised p-3 text-sm">{t("payment")}</p>
        <button type="submit" className="btn">
          {t("submit")}
        </button>
        <Link href="/cart" className="text-muted">
          {t("back")}
        </Link>
      </form>
    </div>
  );
}
