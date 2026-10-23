"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ApiError, formatDate, formatPrice, img, type Order, type TKey } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { api } from "@/lib/api";

export default function Page() {
  return (
    <Suspense>
      <OrderPage />
    </Suspense>
  );
}

function OrderPage() {
  const { t, locale, user, userLoaded, toast, errorMessage } = useStore();
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(() => {
    api.order(id).then(setOrder).catch((e) => {
      if (e instanceof ApiError && e.status === 404) setMissing(true);
    });
  }, [id]);

  useEffect(() => {
    if (userLoaded && !user) router.replace(`/login?next=/orders/${id}`);
    if (user) load();
  }, [user, userLoaded, id, load, router]);

  if (missing) {
    return (
      <div className="container section">
        <div className="empty"><h3>{t("err.not_found")}</h3><Link href="/profile" className="btn btn-ghost">{t("nav.orders")}</Link></div>
      </div>
    );
  }
  if (!order) return <div className="container section"><div className="skel" style={{ height: 400 }} /></div>;

  const cancel = async () => {
    if (!confirm(`${t("order.cancel")}?`)) return;
    try {
      setOrder(await api.cancelOrder(order.id));
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <nav className="crumbs"><Link href="/profile">{t("nav.orders")}</Link> / <span>{order.number}</span></nav>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <h1>{t("order.title", { n: order.number })}</h1>
          <span className={`status ${order.status}`}>{t(`status.${order.status}` as TKey)}</span>
        </div>
        <p className="muted" style={{ marginTop: 6 }}>{formatDate(order.createdAt, locale)}</p>
      </div>
      {sp.get("new") && (
        <div className="alert alert-ok" style={{ marginBottom: 18 }}>
          <Icon name="check" size={16} /> {t("checkout.success", { n: order.number })}
        </div>
      )}
      <div className="two-col">
        <div className="stack" style={{ gap: 18 }}>
          <section className="panel">
            <h3 style={{ marginBottom: 8 }}>{t("order.items")}</h3>
            {order.items.map((i, k) => (
              <div key={k} className="cart-line">
                {i.image ? <img src={img(i.image, 200)} alt="" /> : <div />}
                <div>
                  {i.slug ? <Link href={`/product/${i.slug}`} style={{ fontWeight: 650 }}>{i.name}</Link> : <b>{i.name}</b>}
                  <div className="muted small">{i.variantName} · {i.sku}</div>
                  <div className="small" style={{ marginTop: 4 }}>{formatPrice(i.unitPrice, order.currency, locale)} × {i.quantity}</div>
                </div>
                <b className="right">{formatPrice(i.lineTotal, order.currency, locale)}</b>
              </div>
            ))}
          </section>
          <section className="panel">
            <h3 style={{ marginBottom: 16 }}>{t("order.timeline")}</h3>
            <ul className="timeline">
              {order.history.map((h, k) => (
                <li key={k}>
                  <b>{t(`status.${h.status}` as TKey)}</b>
                  <div className="faint small">{formatDate(h.createdAt, locale)}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="stack sticky">
          <section className="panel">
            <div className="summary-row"><span className="muted">{t("cart.subtotal")}</span><span>{formatPrice(order.subtotal, order.currency, locale)}</span></div>
            {order.discount > 0 && <div className="summary-row"><span className="muted">{t("checkout.discount")} {order.promoCode && `(${order.promoCode})`}</span><span style={{ color: "var(--success)" }}>−{formatPrice(order.discount, order.currency, locale)}</span></div>}
            <div className="summary-row"><span className="muted">{t("checkout.deliveryFee")}</span><span>{order.deliveryFee ? formatPrice(order.deliveryFee, order.currency, locale) : t("delivery.free")}</span></div>
            <div className="summary-row total"><span>{t("checkout.total")}</span><span>{formatPrice(order.total, order.currency, locale)}</span></div>
          </section>
          <section className="panel stack small" style={{ gap: 8 }}>
            <div><span className="muted">{t("checkout.payment")}: </span>{t(`pay.${order.paymentMethod}` as TKey)}</div>
            <div><span className="muted">{t("checkout.delivery")}: </span>{t(`delivery.${order.deliveryMethod}` as TKey)}</div>
            <div><span className="muted">{t("checkout.name")}: </span>{order.customerName}, {order.phone}</div>
            <div><span className="muted">{t("checkout.address")}: </span>{order.city}{order.address ? `, ${order.address}` : ""}</div>
            {order.comment && <div><span className="muted">{t("checkout.comment")}: </span>{order.comment}</div>}
          </section>
          {["pending_payment", "confirmed"].includes(order.status) && (
            <button className="btn btn-danger" onClick={cancel}>{t("order.cancel")}</button>
          )}
        </aside>
      </div>
    </div>
  );
}
