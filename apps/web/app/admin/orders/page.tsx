"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate, formatPrice, ORDER_STATUSES, type TKey } from "@bayhan/shared";
import { useStore } from "@/components/StoreProvider";
import { adminApi, type AdminOrderRow } from "@/lib/admin-api";

export default function AdminOrders() {
  const { t, locale, toast, errorMessage } = useStore();
  const router = useRouter();
  const [rows, setRows] = useState<AdminOrderRow[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      adminApi.orders(q.trim() || undefined, status || undefined).then(setRows).catch((e) => toast(errorMessage(e), "error"));
    }, 250);
    return () => clearTimeout(id);
  }, [q, status, toast, errorMessage]);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <h1 style={{ fontSize: 30 }}>{t("admin.orders")}</h1>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder={`${t("admin.search")} BM-000001, +998…`} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t("order.status")}: —</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}` as TKey)}</option>)}
        </select>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th>№</th><th>{t("checkout.name")}</th><th>{t("checkout.city")}</th><th>{t("order.status")}</th><th>{t("checkout.payment")}</th><th style={{ textAlign: "right" }}>{t("checkout.total")}</th></tr>
          </thead>
          <tbody>
            {rows?.map((o) => (
              <tr key={o.id} className="click" onClick={() => router.push(`/admin/orders/${o.id}`)}>
                <td><b>{o.number}</b><div className="faint small">{formatDate(o.createdAt, locale)}</div></td>
                <td>{o.customerName}<div className="faint small">{o.phone}</div></td>
                <td>{o.city}</td>
                <td><span className={`status ${o.status}`}>{t(`status.${o.status}` as TKey)}</span></td>
                <td className="small">{t(`pay.${o.paymentMethod}` as TKey)}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}><b>{formatPrice(o.total, o.currency, locale)}</b></td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={6} className="muted">{t("catalog.empty")}</td></tr>}
          </tbody>
        </table>
        {!rows && <div className="skel" style={{ height: 200, margin: 12 }} />}
      </div>
    </div>
  );
}
