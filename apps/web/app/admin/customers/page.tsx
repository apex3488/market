"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDate } from "@bayhan/shared";
import { useStore } from "@/components/StoreProvider";
import { adminApi, type AdminCustomer } from "@/lib/admin-api";

export default function AdminCustomers() {
  const { t, locale, user, toast, errorMessage } = useStore();
  const [rows, setRows] = useState<AdminCustomer[] | null>(null);
  const [q, setQ] = useState("");
  const load = useCallback(() => adminApi.customers(q.trim() || undefined).then(setRows).catch((e) => toast(errorMessage(e), "error")), [q, toast, errorMessage]);
  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  const setRole = async (c: AdminCustomer, role: "customer" | "admin") => {
    if (!confirm(`${c.name}: ${role}?`)) return;
    await adminApi.setRole(c.id, role).then(() => { toast(t("admin.saved")); load(); }).catch((e) => toast(errorMessage(e), "error"));
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <h1 style={{ fontSize: 30 }}>{t("admin.customers")}</h1>
      <input className="input" style={{ maxWidth: 360 }} placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>{t("auth.name")}</th><th>{t("auth.identifier")}</th><th>{t("admin.ordersCount")}</th><th>{t("order.date")}</th><th>{t("admin.role")}</th></tr></thead>
          <tbody>
            {rows?.map((c) => (
              <tr key={c.id}>
                <td><b>{c.name}</b></td>
                <td className="small">{c.email ?? ""}{c.email && c.phone ? " · " : ""}{c.phone ?? ""}</td>
                <td>{c.orders}</td>
                <td className="small muted">{formatDate(c.createdAt, locale)}</td>
                <td>
                  <select className="select" style={{ height: 34, width: "auto" }} value={c.role} disabled={c.id === user?.id} onChange={(e) => setRole(c, e.target.value as "customer" | "admin")}>
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows && <div className="skel" style={{ height: 200, margin: 12 }} />}
      </div>
    </div>
  );
}
