"use client";

import Link from "next/link";
import { CART_MAX_QTY, formatPrice, img } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { api } from "@/lib/api";

export default function CartPage() {
  const { t, locale, cart, setCart, toast, errorMessage } = useStore();

  const run = async (fn: () => ReturnType<typeof api.cart>) => {
    try {
      setCart(await fn());
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  if (!cart) {
    return (
      <div className="container section">
        <div className="skel" style={{ height: 320 }} />
      </div>
    );
  }

  const discount = cart.items.reduce((a, l) => a + ((l.compareAtPrice ?? l.unitPrice) - l.unitPrice) * l.quantity, 0);
  const problems = cart.items.some((l) => l.quantity > l.available);

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t("cart.title")}</h1>
      </div>
      {cart.items.length === 0 ? (
        <div className="empty">
          <div className="ic"><Icon name="cart" size={28} /></div>
          <h3>{t("cart.empty")}</h3>
          <p className="muted">{t("cart.emptyHint")}</p>
          <Link href="/catalog" className="btn btn-primary">{t("hero.cta")}</Link>
        </div>
      ) : (
        <div className="two-col">
          <div className="panel">
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="muted">{t("cart.items", { n: cart.count })}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => run(api.clearCart)}><Icon name="trash" size={15} /> {t("cart.clear")}</button>
            </div>
            {cart.items.map((l) => (
              <div className="cart-line" key={l.variantId}>
                <Link href={`/product/${l.slug}`}>{l.image ? <img src={img(l.image, 200)} alt={l.name} /> : <div className="skel" style={{ width: 96, height: 96 }} />}</Link>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/product/${l.slug}`} style={{ fontWeight: 650 }}>{l.name}</Link>
                  {l.variantName && <div className="muted small">{l.variantName}</div>}
                  <div className="small" style={{ marginTop: 4 }}>
                    {formatPrice(l.unitPrice, cart.currency, locale)}
                    {l.compareAtPrice && <span className="price-old" style={{ marginLeft: 8 }}>{formatPrice(l.compareAtPrice, cart.currency, locale)}</span>}
                  </div>
                  {l.quantity > l.available && <div className="small" style={{ color: "var(--danger)", marginTop: 4 }}>{t("cart.unavailable")} ({l.available})</div>}
                </div>
                <div className="right stack" style={{ alignItems: "flex-end", gap: 8 }}>
                  <b>{formatPrice(l.lineTotal, cart.currency, locale)}</b>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="qty sm">
                      <button onClick={() => (l.quantity > 1 ? run(() => api.setCartQty(l.variantId, l.quantity - 1)) : run(() => api.removeFromCart(l.variantId)))} aria-label="-"><Icon name="minus" size={14} /></button>
                      <span>{l.quantity}</span>
                      <button
                        onClick={() => run(() => api.setCartQty(l.variantId, l.quantity + 1))}
                        disabled={l.quantity >= Math.min(CART_MAX_QTY, l.available)}
                        aria-label="+"
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                    <button className="btn btn-sm btn-ghost btn-icon" onClick={() => run(() => api.removeFromCart(l.variantId))} aria-label={t("cart.remove")}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <aside className="panel sticky">
            <h3 style={{ marginBottom: 14 }}>{t("checkout.summary")}</h3>
            <div className="summary-row"><span className="muted">{t("cart.subtotal")} ({cart.count})</span><span>{formatPrice(cart.subtotal + discount, cart.currency, locale)}</span></div>
            {discount > 0 && <div className="summary-row"><span className="muted">{t("checkout.discount")}</span><span style={{ color: "var(--success)" }}>−{formatPrice(discount, cart.currency, locale)}</span></div>}
            <div className="summary-row total"><span>{t("checkout.total")}</span><span>{formatPrice(cart.subtotal, cart.currency, locale)}</span></div>
            <p className="faint small" style={{ margin: "10px 0 16px" }}>{t("cart.serverNote")}</p>
            {problems ? (
              <div className="alert alert-error">{t("err.out_of_stock")}</div>
            ) : (
              <Link href="/checkout" className="btn btn-primary btn-lg btn-block">{t("cart.checkout")} <Icon name="arrow" size={18} /></Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
