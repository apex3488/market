"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, formatPrice, type TKey } from "@bayhan/shared";
import { useStore } from "@/components/StoreProvider";
import { adminApi, type AdminStats } from "@/lib/admin-api";

export default function AdminDashboard() {
  const { t, locale, toast, errorMessage } = useStore();
  const [s, setS] = useState<AdminStats | null>(null);
  useEffect(() => {
    adminApi.stats().then(setS).catch((e) => toast(errorMessage(e), "error"));
  }, [toast, errorMessage]);
  if (!s) return <div className="skel" style={{ height: 300 }} />;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <h1 style={{ fontSize: 30 }}>{t("admin.dashboard")}</h1>
      <div className="stat-grid">
        <div className="card stat"><span>{t("admin.revenue")}</span><b>{formatPrice(s.revenue, s.currency, locale)}</b></div>
        <div className="card stat"><span>{t("admin.ordersCount")}</span><b>{s.orders} <small className="faint" style={{ fontSize: 14 }}>/ {s.openOrders}</small></b></div>
        <div className="card stat"><span>{t("admin.customersCount")}</span><b>{s.customers}</b></div>
        <div className="card stat"><span>{t("admin.productsCount")}</span><b>{s.products}</b></div>
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <h3>{t("admin.recentOrders")}</h3>
            <Link href="/admin/orders" className="small" style={{ color: "var(--glow)" }}>{t("common.all")}</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {s.recentOrders.map((o) => (
                  <tr key={o.id} className="click" onClick={() => (location.href = `/admin/orders/${o.id}`)}>
                    <td><b>{o.number}</b><div className="faint small">{formatDate(o.createdAt, locale)}</div></td>
                    <td>{o.customerName}</td>
                    <td><span className={`status ${o.status}`}>{t(`status.${o.status}` as TKey)}</span></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatPrice(o.total, o.currency, locale)}</td>
                  </tr>
                ))}
                {!s.recentOrders.length && <tr><td className="muted">{t("profile.noOrders")}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h3 style={{ marginBottom: 10 }}>{t("admin.lowStock")}</h3>
          {s.lowStock.map((l) => (
            <div key={l.sku} className="summary-row small">
              <span>{l.name}<div className="faint">{l.sku}</div></span>
              <b style={{ color: l.free === 0 ? "var(--danger)" : "var(--warning)" }}>{l.free}</b>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
