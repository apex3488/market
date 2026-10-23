"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice, img } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { adminApi, type AdminProductRow } from "@/lib/admin-api";

export default function AdminProducts() {
  const { t, locale, toast, errorMessage } = useStore();
  const router = useRouter();
  const [rows, setRows] = useState<AdminProductRow[] | null>(null);
  const [currency, setCurrency] = useState("UZS");
  const [q, setQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      adminApi.products(q.trim() || undefined).then((r) => {
        setRows(r.items);
        setCurrency(r.currency);
      }).catch((e) => toast(errorMessage(e), "error"));
    }, 250);
    return () => clearTimeout(id);
  }, [q, toast, errorMessage]);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between">
        <h1 style={{ fontSize: 30 }}>{t("admin.products")}</h1>
        <Link href="/admin/products/new" className="btn btn-primary"><Icon name="plus" size={18} /> {t("admin.newProduct")}</Link>
      </div>
      <input className="input" style={{ maxWidth: 360 }} placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th /><th>{t("auth.name")}</th><th>{t("catalog.category")}</th><th>{t("admin.price")}</th><th>{t("admin.stock")}</th><th>{t("admin.active")}</th></tr></thead>
          <tbody>
            {rows?.map((p) => (
              <tr key={p.id} className="click" onClick={() => router.push(`/admin/products/${p.id}`)}>
                <td>{p.image && <img src={img(p.image, 100)} alt="" />}</td>
                <td><b>{p.name}</b><div className="faint small">{p.brand} · {p.slug}</div></td>
                <td className="small">{p.category}</td>
                <td style={{ whiteSpace: "nowrap" }}>{formatPrice(p.price ?? 0, currency, locale)}</td>
                <td style={{ color: p.stock === 0 ? "var(--danger)" : p.stock <= 3 ? "var(--warning)" : undefined }}>{p.stock}</td>
                <td>{p.isActive ? <Icon name="check" size={18} /> : <span className="faint">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows && <div className="skel" style={{ height: 200, margin: 12 }} />}
      </div>
    </div>
  );
}
