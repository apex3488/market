"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { adminApi, type AdminBrand } from "@/lib/admin-api";

type Draft = Omit<AdminBrand, "id"> & { id?: string };

export default function AdminBrands() {
  const { t, toast, errorMessage } = useStore();
  const [rows, setRows] = useState<AdminBrand[]>([]);
  const [d, setD] = useState<Draft | null>(null);
  const load = useCallback(() => adminApi.brands().then(setRows).catch((e) => toast(errorMessage(e), "error")), [toast, errorMessage]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!d) return;
    try {
      await adminApi.saveBrand({ ...d, logoUrl: d.logoUrl || null });
      setD(null);
      toast(t("admin.saved"));
      load();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const del = async (id: string) => {
    if (!confirm(`${t("common.delete")}?`)) return;
    await adminApi.deleteBrand(id).then(load).catch((e) => toast(errorMessage(e), "error"));
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between">
        <h1 style={{ fontSize: 30 }}>{t("admin.brands")}</h1>
        <button className="btn btn-primary" onClick={() => setD({ slug: "", name: "", logoUrl: null })}><Icon name="plus" size={18} /> {t("common.add")}</button>
      </div>
      {d && (
        <div className="panel form-grid">
          <input className="input" placeholder={t("auth.name")} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value, slug: d.id ? d.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })} />
          <input className="input" placeholder="slug" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} />
          <div className="row"><button className="btn btn-primary" onClick={save}>{t("common.save")}</button><button className="btn btn-ghost" onClick={() => setD(null)}>{t("common.cancel")}</button></div>
        </div>
      )}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>{t("auth.name")}</th><th>Slug</th><th /></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td><b>{b.name}</b></td><td className="muted">{b.slug}</td>
                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setD(b)} aria-label={t("common.edit")}><Icon name="edit" size={15} /></button>{" "}
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => del(b.id)} aria-label={t("common.delete")}><Icon name="trash" size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
