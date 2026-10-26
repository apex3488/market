import { getTranslations, setRequestLocale } from "next-intl/server";
import { cartRepository } from "@market/data";
import { removeCartItemAction, updateCartItemAction } from "@/lib/cart-actions";
import { getCartOwnerKey } from "@/lib/cart";
import { formatUzs } from "@/lib/format";
import { Link } from "@/i18n/navigation";

export default async function CartPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  const ownerKey = await getCartOwnerKey();
  const cart = await cartRepository.get(ownerKey);

  return (
    <div className="grid gap-8 py-8">
      <h1 className="page-title">{t("title")}</h1>
      {error === "empty" ? <p className="text-danger">{t("errorEmpty")}</p> : null}
      {error === "variant" ? <p className="text-danger">{t("errorVariant")}</p> : null}
      {cart.items.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <ul className="grid gap-3">
            {cart.items.map((item) => (
              <li key={item.variantId} className="grid gap-3 border border-line bg-surface p-4 sm:grid-cols-[1fr_auto]">
                <div className="grid gap-1">
                  <p>{item.title}</p>
                  <p className="text-sm text-muted">{item.sku}</p>
                  <p>{formatUzs(locale, item.unitPriceUzs)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={updateCartItemAction} className="flex items-center gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="variantId" value={item.variantId} />
                    <label className="sr-only" htmlFor={`qty-${item.variantId}`}>
                      {t("qty")}
                    </label>
                    <input
                      id={`qty-${item.variantId}`}
                      className="field w-20"
                      type="number"
                      name="quantity"
                      min={0}
                      defaultValue={item.quantity}
                    />
                    <button type="submit" className="btn btn-ghost">
                      {t("update")}
                    </button>
                  </form>
                  <form action={removeCartItemAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="variantId" value={item.variantId} />
                    <button type="submit" className="btn btn-ghost">
                      {t("remove")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <aside className="grid h-fit gap-4 border border-line bg-raised p-5">
            <p className="text-lg">
              {t("total")}: {formatUzs(locale, cart.totalUzs)}
            </p>
            <p className="text-sm text-muted">{t("recalc")}</p>
            <Link href="/checkout" className="btn">
              {t("checkout")}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
