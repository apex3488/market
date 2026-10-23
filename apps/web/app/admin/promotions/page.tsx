"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { adminApi, type AdminPromotion } from "@/lib/admin-api";

export default function AdminPromotions() {
  const { t, locale, toast, errorMessage } = useStore();
  const [rows, setRows] = useState<AdminPromotion[]>([]);
  const [d, setD] = useState<Partial<AdminPromotion> | null>(null);
  const load = useCallback(() => adminApi.promotions().then(setRows).catch((e) => toast(errorMessage(e), "error")), [toast, errorMessage]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!d) return;
    try {
      await adminApi.savePromotion({
        ...d,
        startsAt: d.startsAt ? new Date(d.startsAt).toISOString() : null,
        endsAt: d.endsAt ? new Date(d.endsAt).toISOString() : null,
      });
      setD(null);
      toast(t("admin.saved"));
      load();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  const del = async (id: string) => {
    if (!confirm(`${t("common.delete")}?`)) return;
    await adminApi.deletePromotion(id).then(load).catch((e) => toast(errorMessage(e), "error"));
  };
  const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between">
        <h1 style={{ fontSize: 30 }}>{t("admin.promotions")}</h1>
        <button className="btn btn-primary" onClick={() => setD({ code: "", kind: "percent", value: 5, minSubtotal: 0, isActive: true, usageLimit: null })}>
          <Icon name="plus" size={18} /> {t("common.add")}
        </button>
      </div>
      {d && (
        <div className="panel form-grid">
          <label className="field"><span className="small muted">Code</span><input className="input" value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase() })} /></label>
          <label className="field"><span className="small muted">Type</span>
            <select className="select" value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value as "percent" | "fixed" })}>
              <option value="percent">%</option><option value="fixed">{locale === "ru" ? "Фикс. сумма" : "Fixed amount"}</option>
            </select>
          </label>
          <label className="field"><span className="small muted">{d.kind === "percent" ? "%" : t("admin.price")}</span>
            <input className="input" type="number" min={1} value={d.kind === "percent" ? d.value : (d.value ?? 0) / 100} onChange={(e) => setD({ ...d, value: d.kind === "percent" ? Number(e.target.value) : Math.round(Number(e.target.value) * 100) })} />
          </label>
          <label className="field"><span className="small muted">Min. {t("cart.subtotal").toLowerCase()}</span>
            <input className="input" type="number" min={0} value={(d.minSubtotal ?? 0) / 100} onChange={(e) => setD({ ...d, minSubtotal: Math.round(Number(e.target.value) * 100) })} />
          </label>
          <label className="field"><span className="small muted">Start</span><input className="input" type="date" value={day(d.startsAt)} onChange={(e) => setD({ ...d, startsAt: e.target.value || null })} /></label>
          <label className="field"><span className="small muted">End</span><input className="input" type="date" value={day(d.endsAt)} onChange={(e) => setD({ ...d, endsAt: e.target.value || null })} /></label>
          <label className="field"><span className="small muted">Limit</span><input className="input" type="number" min={1} value={d.usageLimit ?? ""} onChange={(e) => setD({ ...d, usageLimit: e.target.value ? Number(e.target.value) : null })} /></label>
          <label className="checkbox"><input type="checkbox" checked={!!d.isActive} onChange={(e) => setD({ ...d, isActive: e.target.checked })} /> {t("admin.active")}</label>
          <div className="row full"><button className="btn btn-primary" onClick={save}>{t("common.save")}</button><button className="btn btn-ghost" onClick={() => setD(null)}>{t("common.cancel")}</button></div>
        </div>
      )}
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Code</th><th>{t("checkout.discount")}</th><th>Min</th><th>Used</th><th>{t("admin.active")}</th><th /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td><b>{p.code}</b></td>
                <td>{p.kind === "percent" ? `${p.value}%` : formatPrice(p.value, "UZS", locale)}</td>
                <td>{formatPrice(p.minSubtotal, "UZS", locale)}</td>
                <td>{p.usedCount}{p.usageLimit ? ` / ${p.usageLimit}` : ""}</td>
                <td>{p.isActive ? <Icon name="check" size={18} /> : "—"}</td>
                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setD(p)} aria-label={t("common.edit")}><Icon name="edit" size={15} /></button>{" "}
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => del(p.id)} aria-label={t("common.delete")}><Icon name="trash" size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
