"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate, formatPrice, img, ORDER_TRANSITIONS, type Order, type TKey } from "@bayhan/shared";
import { useStore } from "@/components/StoreProvider";
import { adminApi } from "@/lib/admin-api";

export default function AdminOrder() {
  const { t, locale, toast, errorMessage } = useStore();
  const { id } = useParams<{ id: string }>();
  const [o, setO] = useState<Order | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.order(id).then(setO).catch((e) => toast(errorMessage(e), "error"));
  }, [id, toast, errorMessage]);
  if (!o) return <div className="skel" style={{ height: 300 }} />;

  const change = async (status: Order["status"]) => {
    if (status === "cancelled" && !confirm(`${t("status.cancelled")}?`)) return;
    setBusy(true);
    try {
      setO(await adminApi.setOrderStatus(o.id, status, note || undefined));
      setNote("");
      toast(t("admin.saved"));
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const next = ORDER_TRANSITIONS[o.status];

  return (
    <div className="stack" style={{ gap: 18 }}>
      <nav className="crumbs"><Link href="/admin/orders">{t("admin.orders")}</Link> / <span>{o.number}</span></nav>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 28 }}>{o.number}</h1>
        <span className={`status ${o.status}`}>{t(`status.${o.status}` as TKey)}</span>
        <span className="faint small">{formatDate(o.createdAt, locale)} · {o.client}</span>
      </div>
      <div className="two-col">
        <div className="stack" style={{ gap: 18 }}>
          <section className="panel">
            {o.items.map((i, k) => (
              <div key={k} className="cart-line">
                {i.image ? <img src={img(i.image, 160)} alt="" /> : <div />}
                <div><b>{i.name}</b><div className="muted small">{i.variantName} · {i.sku}</div><div className="small">{formatPrice(i.unitPrice, o.currency, locale)} × {i.quantity}</div></div>
                <b className="right">{formatPrice(i.lineTotal, o.currency, locale)}</b>
              </div>
            ))}
            <div className="summary-row"><span className="muted">{t("cart.subtotal")}</span><span>{formatPrice(o.subtotal, o.currency, locale)}</span></div>
            {o.discount > 0 && <div className="summary-row"><span className="muted">{t("checkout.discount")} ({o.promoCode})</span><span>−{formatPrice(o.discount, o.currency, locale)}</span></div>}
            <div className="summary-row"><span className="muted">{t("checkout.deliveryFee")}</span><span>{formatPrice(o.deliveryFee, o.currency, locale)}</span></div>
            <div className="summary-row total"><span>{t("checkout.total")}</span><span>{formatPrice(o.total, o.currency, locale)}</span></div>
          </section>
          <section className="panel">
            <h3 style={{ marginBottom: 14 }}>{t("order.timeline")}</h3>
            <ul className="timeline">
              {o.history.map((h, k) => (
                <li key={k}><b>{t(`status.${h.status}` as TKey)}</b>{h.note && <span className="muted"> — {h.note}</span>}<div className="faint small">{formatDate(h.createdAt, locale)}</div></li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="stack">
          <section className="panel stack small" style={{ gap: 8 }}>
            <b style={{ fontSize: 15 }}>{o.customerName}</b>
            <a href={`tel:${o.phone}`} style={{ color: "var(--glow)" }}>{o.phone}</a>
            {o.email && <span>{o.email}</span>}
            <span>{t(`delivery.${o.deliveryMethod}` as TKey)} · {o.city}{o.address ? `, ${o.address}` : ""}</span>
            <span>{t(`pay.${o.paymentMethod}` as TKey)}</span>
            {o.comment && <span className="muted">“{o.comment}”</span>}
          </section>
          {next.length > 0 && (
            <section className="panel stack">
              <h3>{t("admin.changeStatus")}</h3>
              <input className="input" placeholder={t("checkout.comment")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
              {next.map((s) => (
                <button key={s} className={`btn ${s === "cancelled" ? "btn-danger" : "btn-primary"}`} disabled={busy} onClick={() => change(s)}>
                  → {t(`status.${s}` as TKey)}
                </button>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
