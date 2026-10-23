"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { adminApi, type AdminCategory } from "@/lib/admin-api";

type Draft = Omit<AdminCategory, "id" | "specFilters"> & { id?: string; specFilters: string };
const blank: Draft = { slug: "", nameRu: "", nameEn: "", icon: "box", imageUrl: null, sortOrder: 0, specFilters: "" };

export default function AdminCategories() {
  const { t, toast, errorMessage } = useStore();
  const [rows, setRows] = useState<AdminCategory[]>([]);
  const [d, setD] = useState<Draft | null>(null);
  const load = useCallback(() => adminApi.categories().then(setRows).catch((e) => toast(errorMessage(e), "error")), [toast, errorMessage]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!d) return;
    try {
      await adminApi.saveCategory({ ...d, imageUrl: d.imageUrl || null, specFilters: d.specFilters.split(",").map((s) => s.trim()).filter(Boolean) });
      setD(null);
      toast(t("admin.saved"));
      load();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const del = async (id: string) => {
    if (!confirm(`${t("common.delete")}?`)) return;
    await adminApi.deleteCategory(id).then(load).catch((e) => toast(errorMessage(e), "error"));
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between">
        <h1 style={{ fontSize: 30 }}>{t("admin.categories")}</h1>
        <button className="btn btn-primary" onClick={() => setD({ ...blank, sortOrder: rows.length })}><Icon name="plus" size={18} /> {t("common.add")}</button>
      </div>
      {d && (
        <div className="panel form-grid">
          <input className="input" placeholder="slug" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} />
          <input className="input" placeholder="icon (phone, laptop, tv…)" value={d.icon} onChange={(e) => setD({ ...d, icon: e.target.value })} />
          <input className="input" placeholder="Название (RU)" value={d.nameRu} onChange={(e) => setD({ ...d, nameRu: e.target.value })} />
          <input className="input" placeholder="Name (EN)" value={d.nameEn} onChange={(e) => setD({ ...d, nameEn: e.target.value })} />
          <input className="input" placeholder="Image URL" value={d.imageUrl ?? ""} onChange={(e) => setD({ ...d, imageUrl: e.target.value })} />
          <input className="input" placeholder="Filters: storage, ram" value={d.specFilters} onChange={(e) => setD({ ...d, specFilters: e.target.value })} />
          <input className="input" type="number" placeholder="sort" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: Number(e.target.value) })} />
          <div className="row"><button className="btn btn-primary" onClick={save}>{t("common.save")}</button><button className="btn btn-ghost" onClick={() => setD(null)}>{t("common.cancel")}</button></div>
        </div>
      )}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>#</th><th>Slug</th><th>RU</th><th>EN</th><th>Filters</th><th /></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.sortOrder}</td><td>{c.slug}</td><td>{c.nameRu}</td><td>{c.nameEn}</td><td className="small muted">{c.specFilters.join(", ")}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setD({ ...c, specFilters: c.specFilters.join(", ") })} aria-label={t("common.edit")}><Icon name="edit" size={15} /></button>{" "}
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => del(c.id)} aria-label={t("common.delete")}><Icon name="trash" size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

