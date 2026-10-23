"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SORTS, type ProductListResponse, type SortKey } from "@bayhan/shared";
import { Icon } from "./Icon";
import { ProductCard, ProductSkeleton } from "./ProductCard";
import { useStore } from "./StoreProvider";

/** Filter panel + results. Filters live in the URL, so pages are shareable and server-rendered. */
export function CatalogView({ data, categories }: { data: ProductListResponse; categories?: { slug: string; name: string; count: number }[] }) {
  const { t } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const brands = new Set((sp.get("brand") ?? "").split(",").filter(Boolean));
  const specSel = parseSpecs(sp.get("specs"));
  const [minP, setMinP] = useState(sp.get("minPrice") ? String(Number(sp.get("minPrice")) / 100) : "");
  const [maxP, setMaxP] = useState(sp.get("maxPrice") ? String(Number(sp.get("maxPrice")) / 100) : "");
  useEffect(() => {
    setMinP(sp.get("minPrice") ? String(Number(sp.get("minPrice")) / 100) : "");
    setMaxP(sp.get("maxPrice") ? String(Number(sp.get("maxPrice")) / 100) : "");
  }, [sp]);

  const push = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    p.delete("page");
    start(() => router.push(`${pathname}?${p.toString()}`, { scroll: false }));
  };

  const toggleBrand = (slug: string) =>
    push((p) => {
      const next = new Set(brands);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      if (next.size) p.set("brand", [...next].join(","));
      else p.delete("brand");
    });

  const toggleSpec = (key: string, value: string) =>
    push((p) => {
      const cur = new Set(specSel[key] ?? []);
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      const next = { ...specSel, [key]: [...cur] };
      const str = Object.entries(next).filter(([, v]) => v.length).map(([k, v]) => `${k}:${v.join("|")}`).join(";");
      if (str) p.set("specs", str);
      else p.delete("specs");
    });

  const applyPrice = () =>
    push((p) => {
      const toMinor = (v: string) => String(Math.round(Number(v.replace(/\s/g, "")) * 100));
      if (minP && Number(minP) > 0) p.set("minPrice", toMinor(minP));
      else p.delete("minPrice");
      if (maxP && Number(maxP) > 0) p.set("maxPrice", toMinor(maxP));
      else p.delete("maxPrice");
    });

  const reset = () => {
    const p = new URLSearchParams();
    if (sp.get("q")) p.set("q", sp.get("q")!);
    start(() => router.push(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false }));
  };
  const hasFilters = ["brand", "specs", "minPrice", "maxPrice", "inStock", "tag"].some((k) => sp.get(k));
  const pageHref = (n: number) => {
    const p = new URLSearchParams(sp.toString());
    p.set("page", String(n));
    return `${pathname}?${p}`;
  };

  const filters = (
    <aside className={`card filters ${open ? "open" : ""}`} aria-label={t("catalog.filters")}>
      <div className="row-between">
        <h3>{t("catalog.filters")}</h3>
        <div className="row">
          {hasFilters && <button className="btn btn-sm btn-ghost" onClick={reset}>{t("catalog.reset")}</button>}
          <button className="btn btn-sm btn-ghost btn-icon only-mobile" onClick={() => setOpen(false)} aria-label={t("common.close")}><Icon name="close" size={18} /></button>
        </div>
      </div>
      {categories && categories.length > 0 && (
        <div className="group">
          <h4>{t("catalog.category")}</h4>
          <div className="stack" style={{ gap: 4 }}>
            {categories.map((c) => (
              <Link key={c.slug} href={`/catalog/${c.slug}${sp.get("q") ? `?q=${encodeURIComponent(sp.get("q")!)}` : ""}`} className="checkbox" style={{ justifyContent: "space-between" }}>
                <span>{c.name}</span><span className="count">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="group">
        <h4>{t("catalog.price")}</h4>
        <form className="price-inputs" onSubmit={(e) => { e.preventDefault(); applyPrice(); }}>
          <input className="input" inputMode="numeric" placeholder={`${t("catalog.from")} ${Math.floor(data.facets.price.min / 100).toLocaleString()}`} value={minP} onChange={(e) => setMinP(e.target.value.replace(/[^\d]/g, ""))} onBlur={applyPrice} aria-label={t("catalog.from")} />
          <input className="input" inputMode="numeric" placeholder={`${t("catalog.to")} ${Math.ceil(data.facets.price.max / 100).toLocaleString()}`} value={maxP} onChange={(e) => setMaxP(e.target.value.replace(/[^\d]/g, ""))} onBlur={applyPrice} aria-label={t("catalog.to")} />
        </form>
      </div>
      <div className="group">
        <label className="checkbox">
          <input type="checkbox" checked={!!sp.get("inStock")} onChange={(e) => push((p) => (e.target.checked ? p.set("inStock", "1") : p.delete("inStock")))} />
          {t("catalog.inStock")}
        </label>
      </div>
      {data.facets.brands.length > 1 && (
        <div className="group">
          <h4>{t("catalog.brand")}</h4>
          {data.facets.brands.map((b) => (
            <label key={b.slug} className="checkbox">
              <input type="checkbox" checked={brands.has(b.slug)} onChange={() => toggleBrand(b.slug)} />
              {b.name}<span className="count">{b.count}</span>
            </label>
          ))}
        </div>
      )}
      {data.facets.specs.map((f) => (
        <div className="group" key={f.key}>
          <h4>{f.label}</h4>
          {f.values.map((v) => (
            <label key={v.value} className="checkbox">
              <input type="checkbox" checked={!!specSel[f.key]?.includes(v.value)} onChange={() => toggleSpec(f.key, v.value)} />
              {v.value}<span className="count">{v.count}</span>
            </label>
          ))}
        </div>
      ))}
      <button className="btn btn-primary only-mobile" onClick={() => setOpen(false)}>{t("catalog.apply")} ({data.total})</button>
    </aside>
  );

  return (
    <div className="catalog">
      {filters}
      {open && <div className="overlay only-mobile" onClick={() => setOpen(false)} />}
      <div>
        <div className="toolbar">
          <span className="muted">{t("catalog.found", { n: data.total })}</span>
          <div className="row">
            <button className="btn btn-sm btn-ghost only-mobile" onClick={() => setOpen(true)}><Icon name="filter" size={16} /> {t("catalog.filters")}</button>
            <select
              className="select"
              value={(sp.get("sort") as SortKey) ?? "popular"}
              onChange={(e) => push((p) => p.set("sort", e.target.value))}
              aria-label={t("catalog.sort")}
            >
              {SORTS.map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
            </select>
          </div>
        </div>
        {pending ? (
          <div className="grid cols-3">{Array.from({ length: 6 }, (_, i) => <ProductSkeleton key={i} />)}</div>
        ) : data.items.length ? (
          <div className="grid cols-3">{data.items.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 3} />)}</div>
        ) : (
          <div className="empty">
            <div className="ic"><Icon name="search" size={28} /></div>
            <h3>{t("catalog.empty")}</h3>
            <p className="muted">{t("catalog.emptyHint")}</p>
            {hasFilters && <button className="btn btn-ghost" onClick={reset}>{t("catalog.reset")}</button>}
          </div>
        )}
        {data.pages > 1 && (
          <nav className="pagination" aria-label="pagination">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) =>
              n === data.page ? <span key={n} className="cur">{n}</span> : <Link key={n} href={pageHref(n)}>{n}</Link>,
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

function parseSpecs(raw: string | null): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const part of (raw ?? "").split(";")) {
    const [k, v] = part.split(":");
    if (k && v) out[k] = v.split("|");
  }
  return out;
}
