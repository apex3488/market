"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, img, type ProductDetail } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { api } from "@/lib/api";

export default function ComparePage() {
  const { t, locale, compareIds, toggleCompare, clearCompare, addToCart } = useStore();
  const [items, setItems] = useState<ProductDetail[] | null>(null);

  useEffect(() => {
    if (!compareIds.length) {
      setItems([]);
      return;
    }
    // compare stores product ids; resolve slugs via the list endpoint, then load full specs
    api.products({ ids: compareIds.join(","), limit: 10 })
      .then((r) => Promise.all(r.items.map((p) => api.product(p.slug))))
      .then(setItems)
      .catch(() => setItems([]));
  }, [compareIds]);

  const rows = (() => {
    if (!items?.length) return [];
    const keys = new Map<string, string>();
    for (const p of items) for (const s of p.specs) if (!keys.has(s.key)) keys.set(s.key, s.label);
    return [...keys.entries()].map(([key, label]) => {
      const values = items.map((p) => p.specs.find((s) => s.key === key)?.value ?? "—");
      return { key, label, values, diff: new Set(values).size > 1 };
    });
  })();

  return (
    <div className="container">
      <div className="page-head row-between">
        <h1>{t("compare.title")}</h1>
        {compareIds.length > 0 && <button className="btn btn-ghost btn-sm" onClick={clearCompare}>{t("compare.clear")}</button>}
      </div>
      {!items ? (
        <div className="skel" style={{ height: 300 }} />
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="ic"><Icon name="compare" size={28} /></div>
          <h3>{t("compare.empty")}</h3>
          <Link href="/catalog" className="btn btn-primary">{t("hero.cta")}</Link>
        </div>
      ) : (
        <div className="compare-wrap">
          <table className="compare">
            <tbody>
              <tr>
                <th />
                {items.map((p) => (
                  <td key={p.id}>
                    <div className="stack" style={{ gap: 10 }}>
                      <Link href={`/product/${p.slug}`}>{p.image && <img src={img(p.image, 260)} alt={p.name} />}</Link>
                      <Link href={`/product/${p.slug}`} style={{ fontWeight: 650 }}>{p.name}</Link>
                      <b className="price" style={{ fontSize: 17 }}>{formatPrice(p.price, p.currency, locale)}</b>
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn btn-primary btn-sm" disabled={!p.inStock || !p.defaultVariantId} onClick={() => p.defaultVariantId && addToCart(p.defaultVariantId)}>
                          <Icon name="cart" size={15} /> {t("product.addToCart")}
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toggleCompare(p.id)} aria-label={t("cart.remove")}><Icon name="close" size={15} /></button>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <th>{t("catalog.brand")}</th>
                {items.map((p) => <td key={p.id}>{p.brand.name}</td>)}
              </tr>
              <tr>
                <th>{t("product.inStock")}</th>
                {items.map((p) => <td key={p.id}>{p.inStock ? t("common.yes") : t("common.no")}</td>)}
              </tr>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th>{r.label}</th>
                  {r.values.map((v, i) => <td key={i} className={r.diff ? "diff" : ""}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
