"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, img } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { adminApi, type AdminBrand, type AdminCategory, type AdminProduct, type AdminVariant } from "@/lib/admin-api";

const empty: AdminProduct = {
  slug: "", name: "", categoryId: "", brandId: "", descriptionRu: "", descriptionEn: "",
  isActive: true, isNew: false, isFeatured: false, images: [], specs: [],
  variants: [{ sku: "", name: "", options: {}, price: 0, compareAtPrice: null, stock: 0, isDefault: true }],
};

const toMajor = (minor: number | null) => (minor == null ? "" : String(minor / 100));
const toMinor = (major: string) => Math.round(Number(major.replace(/[\s,]/g, "")) * 100) || 0;

export default function AdminProductEdit() {
  const { t, locale, toast, errorMessage } = useStore();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const [p, setP] = useState<AdminProduct | null>(isNew ? empty : null);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.categories().then(setCats).catch(() => undefined);
    adminApi.brands().then(setBrands).catch(() => undefined);
    if (!isNew) adminApi.product(id).then(setP).catch((e) => toast(errorMessage(e), "error"));
  }, [id, isNew, toast, errorMessage]);

  if (!p) return <div className="skel" style={{ height: 400 }} />;
  const up = (patch: Partial<AdminProduct>) => setP({ ...p, ...patch });
  const upVariant = (i: number, patch: Partial<AdminVariant>) => up({ variants: p.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)) });

  const save = async () => {
    setBusy(true);
    setFields({});
    try {
      const body = { ...p, categoryId: p.categoryId || cats[0]?.id, brandId: p.brandId || brands[0]?.id };
      if (isNew) {
        const r = await adminApi.createProduct(body);
        router.replace(`/admin/products/${r.id}`);
      } else {
        await adminApi.updateProduct(id, body);
        setP(await adminApi.product(id));
      }
      toast(t("admin.saved"));
    } catch (e) {
      if (e instanceof ApiError && e.fields) setFields(e.fields);
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!confirm(locale === "ru" ? "Скрыть товар из каталога?" : "Hide product from the catalog?")) return;
    await adminApi.archiveProduct(id).catch((e) => toast(errorMessage(e), "error"));
    router.push("/admin/products");
  };

  const fe = (k: string) => fields[k] && <span className="err">{fields[k]}</span>;

  return (
    <div className="stack" style={{ gap: 18 }}>
      <nav className="crumbs"><Link href="/admin/products">{t("admin.products")}</Link> / <span>{p.name || t("admin.newProduct")}</span></nav>
      <div className="row-between" style={{ flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 28 }}>{p.name || t("admin.newProduct")}</h1>
        <div className="row">
          {!isNew && <Link href={`/product/${p.slug}`} className="btn btn-ghost btn-sm" target="_blank">↗</Link>}
          {!isNew && <button className="btn btn-danger btn-sm" onClick={archive}>{locale === "ru" ? "Скрыть" : "Archive"}</button>}
          <button className="btn btn-primary" onClick={save} disabled={busy}>{t("common.save")}</button>
        </div>
      </div>

      <section className="panel">
        <div className="form-grid">
          <label className={`field ${fields.name ? "error" : ""}`}><span className="small muted">{t("auth.name")}</span>
            <input className="input" value={p.name} onChange={(e) => up({ name: e.target.value })} />{fe("name")}
          </label>
          <label className={`field ${fields.slug ? "error" : ""}`}><span className="small muted">Slug (URL)</span>
            <input className="input" value={p.slug} onChange={(e) => up({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="apple-iphone-16" />{fe("slug")}
          </label>
          <label className="field"><span className="small muted">{t("catalog.category")}</span>
            <select className="select" value={p.categoryId} onChange={(e) => up({ categoryId: e.target.value })}>
              {!p.categoryId && <option value="">—</option>}
              {cats.map((c) => <option key={c.id} value={c.id}>{locale === "ru" ? c.nameRu : c.nameEn}</option>)}
            </select>
          </label>
          <label className="field"><span className="small muted">{t("catalog.brand")}</span>
            <select className="select" value={p.brandId} onChange={(e) => up({ brandId: e.target.value })}>
              {!p.brandId && <option value="">—</option>}
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="field full"><span className="small muted">{t("product.description")} (RU)</span>
            <textarea className="textarea" value={p.descriptionRu} onChange={(e) => up({ descriptionRu: e.target.value })} />
          </label>
          <label className="field full"><span className="small muted">{t("product.description")} (EN)</span>
            <textarea className="textarea" value={p.descriptionEn} onChange={(e) => up({ descriptionEn: e.target.value })} />
          </label>
          <div className="row full" style={{ flexWrap: "wrap", gap: 20 }}>
            <label className="checkbox"><input type="checkbox" checked={p.isActive} onChange={(e) => up({ isActive: e.target.checked })} /> {t("admin.active")}</label>
            <label className="checkbox"><input type="checkbox" checked={p.isNew} onChange={(e) => up({ isNew: e.target.checked })} /> {t("product.new")}</label>
            <label className="checkbox"><input type="checkbox" checked={p.isFeatured} onChange={(e) => up({ isFeatured: e.target.checked })} /> {t("home.popular")}</label>
          </div>
        </div>
      </section>

      <section className="panel stack">
        <div className="row-between"><h3>{t("admin.variants")}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => up({ variants: [...p.variants, { sku: "", name: "", options: {}, price: 0, compareAtPrice: null, stock: 0, isDefault: false }] })}><Icon name="plus" size={15} /> {t("common.add")}</button>
        </div>
        {p.variants.map((v, i) => (
          <div key={v.id ?? i} className="card" style={{ padding: 14, background: "var(--bg-2)" }}>
            <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <label className={`field ${fields[`variants.${i}.sku`] ? "error" : ""}`}><span className="small muted">SKU</span><input className="input" value={v.sku} onChange={(e) => upVariant(i, { sku: e.target.value })} /></label>
              <label className="field"><span className="small muted">{t("product.config")}</span><input className="input" value={v.name} onChange={(e) => upVariant(i, { name: e.target.value })} placeholder="256 GB · Black" /></label>
              <label className="field"><span className="small muted">{t("admin.price")}</span><input className="input" inputMode="decimal" defaultValue={toMajor(v.price)} onBlur={(e) => upVariant(i, { price: toMinor(e.target.value) })} /></label>
              <label className="field"><span className="small muted">{t("admin.oldPrice")}</span><input className="input" inputMode="decimal" defaultValue={toMajor(v.compareAtPrice)} onBlur={(e) => upVariant(i, { compareAtPrice: e.target.value ? toMinor(e.target.value) : null })} /></label>
              <label className="field"><span className="small muted">{t("admin.stock")}{v.reserved ? ` (${v.reserved} res.)` : ""}</span><input className="input" type="number" min={0} value={v.stock} onChange={(e) => upVariant(i, { stock: Math.max(0, Number(e.target.value)) })} /></label>
            </div>
            <div className="row-between" style={{ marginTop: 10 }}>
              <label className="checkbox"><input type="radio" name="def" checked={v.isDefault} onChange={() => up({ variants: p.variants.map((x, k) => ({ ...x, isDefault: k === i })) })} /> default</label>
              {p.variants.length > 1 && <button className="btn btn-ghost btn-sm" onClick={() => up({ variants: p.variants.filter((_, k) => k !== i) })}><Icon name="trash" size={15} /></button>}
            </div>
          </div>
        ))}
      </section>

      <section className="panel stack">
        <div className="row-between"><h3>{t("admin.images")}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => up({ images: [...p.images, { url: "", alt: "" }] })}><Icon name="plus" size={15} /> {t("common.add")}</button>
        </div>
        {p.images.map((im, i) => (
          <div key={i} className="row">
            {im.url ? <img src={img(im.url, 100)} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover" }} /> : <div style={{ width: 46 }} />}
            <input className="input grow" value={im.url} placeholder="https://…" onChange={(e) => up({ images: p.images.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)) })} />
            <button className="btn btn-ghost btn-sm btn-icon" disabled={i === 0} onClick={() => { const a = [...p.images]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; up({ images: a }); }} aria-label="up">↑</button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => up({ images: p.images.filter((_, k) => k !== i) })} aria-label={t("common.delete")}><Icon name="trash" size={15} /></button>
          </div>
        ))}
      </section>

      <section className="panel stack">
        <div className="row-between"><h3>{t("product.specs")}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => up({ specs: [...p.specs, { key: "", labelRu: "", labelEn: "", value: "" }] })}><Icon name="plus" size={15} /> {t("common.add")}</button>
        </div>
        {p.specs.map((s, i) => (
          <div key={i} className="form-grid" style={{ gridTemplateColumns: "1fr 1.3fr 1.3fr 1.6fr auto", alignItems: "center" }}>
            {(["key", "labelRu", "labelEn", "value"] as const).map((k) => (
              <input key={k} className="input" placeholder={k} value={s[k]} onChange={(e) => up({ specs: p.specs.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })} />
            ))}
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => up({ specs: p.specs.filter((_, j) => j !== i) })} aria-label={t("common.delete")}><Icon name="trash" size={15} /></button>
          </div>
        ))}
      </section>
      <div><button className="btn btn-primary btn-lg" onClick={save} disabled={busy}>{t("common.save")}</button></div>
    </div>
  );
}
