"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CART_MAX_QTY, discountPercent, formatDate, formatPrice, img, type ProductDetail, type Review } from "@bayhan/shared";
import { api } from "@/lib/api";
import { Icon } from "./Icon";
import { useStore } from "./StoreProvider";

export function ProductView({ p }: { p: ProductDetail }) {
  const { t, locale, addToCart, favIds, toggleFavorite, compareIds, toggleCompare, cart } = useStore();
  const router = useRouter();
  const [vid, setVid] = useState(p.variants.find((v) => v.isDefault)?.id ?? p.variants[0]?.id);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"specs" | "desc" | "reviews">("specs");
  const [busy, setBusy] = useState(false);
  const mainImg = useRef<HTMLDivElement>(null);
  const v = p.variants.find((x) => x.id === vid) ?? p.variants[0];
  const off = v ? discountPercent(v.price, v.compareAtPrice) : null;
  const inCart = cart?.items.some((i) => i.variantId === v?.id);
  const fav = favIds.has(p.id);
  const cmp = compareIds.includes(p.id);
  const images = p.images.length ? p.images : [{ url: "", alt: p.name }];
  const maxQty = Math.min(CART_MAX_QTY, v?.available ?? 0);

  const add = async (go?: boolean) => {
    if (!v) return;
    setBusy(true);
    const ok = await addToCart(v.id, qty, mainImg.current);
    setBusy(false);
    if (ok && go) router.push("/cart");
  };

  return (
    <>
      <div className="product">
        <div className="gallery">
          <div className="thumbs">
            {images.length > 1 &&
              images.map((im, i) => (
                <button key={i} className={i === imgIdx ? "active" : ""} onClick={() => setImgIdx(i)} aria-label={`${i + 1}`}>
                  <img src={img(im.url, 160)} alt="" />
                </button>
              ))}
          </div>
          <div className="main" ref={mainImg}>
            {images[imgIdx]?.url && <img key={imgIdx} src={img(images[imgIdx].url, 1000)} alt={images[imgIdx].alt} />}
          </div>
        </div>

        <div className="buybox">
          <div className="row" style={{ flexWrap: "wrap" }}>
            <Link href={`/catalog?brand=${p.brand.slug}`} className="tag tag-muted">{p.brand.name}</Link>
            {p.isNew && <span className="tag tag-new">{t("product.new")}</span>}
            {off && <span className="tag tag-sale">−{off}%</span>}
            {p.rating && (
              <span className="row small muted" style={{ gap: 6 }}>
                <span className="stars"><Icon name="star" size={14} fill /></span>
                {p.rating.avg.toFixed(1)} · {p.rating.count}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "clamp(26px,3vw,38px)" }}>{p.name}</h1>
          {p.keySpecs.length > 0 && <p className="muted">{p.keySpecs.map((s) => `${s.label}: ${s.value}`).join(" · ")}</p>}

          {p.variants.length > 1 && (
            <div className="stack" style={{ gap: 10 }}>
              <span className="small muted">{t("product.config")}</span>
              <div className="variant-grid">
                {p.variants.map((x) => (
                  <button
                    key={x.id}
                    className={`variant ${x.id === v?.id ? "active" : ""}`}
                    onClick={() => {
                      setVid(x.id);
                      setQty(1);
                    }}
                    aria-pressed={x.id === v?.id}
                  >
                    {x.name || x.sku}
                    <small>
                      {formatPrice(x.price, x.currency, locale)}
                      {x.available === 0 ? ` · ${t("product.outOfStock")}` : ""}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="panel" style={{ padding: 20 }}>
            <div className="row-between" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                {v?.compareAtPrice && <div className="price-old" style={{ fontSize: 15 }}>{formatPrice(v.compareAtPrice, v.currency, locale)}</div>}
                <div className="price">{v ? formatPrice(v.price, v.currency, locale) : "—"}</div>
                <div className="faint small" style={{ marginTop: 4 }}>{t("product.priceNote")}</div>
              </div>
              <StockLabel available={v?.available ?? 0} />
            </div>
            <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
              <div className="qty" aria-label={t("common.qty")}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-"><Icon name="minus" size={16} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))} aria-label="+"><Icon name="plus" size={16} /></button>
              </div>
              <button className="btn btn-primary btn-lg grow" disabled={!v || v.available === 0 || busy} onClick={() => add()}>
                <Icon name="cart" size={18} /> {inCart ? t("product.inCart") : t("product.addToCart")}
              </button>
              <button
                className="btn btn-ghost btn-lg btn-icon"
                style={fav ? { color: "#ff6b81" } : undefined}
                onClick={() => toggleFavorite(p.id)}
                aria-label={t("product.favorite")}
                aria-pressed={fav}
              >
                <Icon name="heart" size={20} fill={fav} />
              </button>
              <button
                className="btn btn-ghost btn-lg btn-icon"
                style={cmp ? { color: "var(--glow)", borderColor: "rgba(88,166,255,.6)" } : undefined}
                onClick={() => toggleCompare(p.id)}
                aria-label={t("product.compare")}
                aria-pressed={cmp}
              >
                <Icon name="compare" size={20} />
              </button>
            </div>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} disabled={!v || v.available === 0 || busy} onClick={() => add(true)}>
              {t("product.buyNow")}
            </button>
          </div>
          <div className="row small muted" style={{ gap: 18, flexWrap: "wrap" }}>
            <span className="row" style={{ gap: 6 }}><Icon name="truck" size={16} /> <Link href="/delivery">{t("nav.delivery")}</Link></span>
            <span className="row" style={{ gap: 6 }}><Icon name="shield" size={16} /> <Link href="/returns">{t("nav.returns")}</Link></span>
          </div>
        </div>
      </div>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="tabs" role="tablist">
          {(["specs", "desc", "reviews"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
              {k === "specs" ? t("product.specs") : k === "desc" ? t("product.description") : t("product.reviews")}
            </button>
          ))}
        </div>
        <div style={{ maxWidth: 860 }}>
          {tab === "specs" && (
            <table className="spec-table">
              <tbody>
                {p.specs.map((s) => (
                  <tr key={s.key}><td>{s.label}</td><td>{s.value}</td></tr>
                ))}
                {v && <tr><td>SKU</td><td>{v.sku}</td></tr>}
              </tbody>
            </table>
          )}
          {tab === "desc" && <p className="prose" style={{ whiteSpace: "pre-line" }}>{p.description}</p>}
          {tab === "reviews" && <Reviews slug={p.slug} />}
        </div>
      </section>
    </>
  );
}

function StockLabel({ available }: { available: number }) {
  const { t } = useStore();
  if (available <= 0) return <span className="stock out">{t("product.outOfStock")}</span>;
  if (available <= 3) return <span className="stock low">{t("product.lowStock", { n: available })}</span>;
  return <span className="stock">{t("product.inStock")}</span>;
}

function Reviews({ slug }: { slug: string }) {
  const { t, locale, user, toast, errorMessage } = useStore();
  const [items, setItems] = useState<Review[] | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.reviews(slug).then(setItems).catch(() => setItems([]));
  }, [slug]);
  const avg = useMemo(() => (items?.length ? items.reduce((a, r) => a + r.rating, 0) / items.length : 0), [items]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.addReview(slug, rating, text.trim());
      setItems((x) => [r, ...(x ?? []).filter((y) => y.id !== r.id)]);
      setText("");
      toast(t("product.reviewSent"));
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!items) return <div className="skel" style={{ height: 80 }} />;
  return (
    <div className="stack" style={{ gap: 18 }}>
      {items.length > 0 && (
        <p className="muted">
          <span className="stars"><Icon name="star" size={15} fill /></span> {avg.toFixed(1)} · {items.length}
        </p>
      )}
      {items.length === 0 && <p className="muted">{t("product.noReviews")}</p>}
      {user ? (
        <form className="panel stack" onSubmit={submit}>
          <b>{t("product.writeReview")}</b>
          <div className="stars" role="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                style={{ background: "none", border: 0, padding: 2, color: n <= rating ? "#ffc85a" : "var(--faint)" }}
                aria-label={`${n}`}
                aria-checked={n === rating}
                role="radio"
              >
                <Icon name="star" size={22} fill={n <= rating} />
              </button>
            ))}
          </div>
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("product.reviewPlaceholder")} minLength={10} maxLength={2000} required />
          <div><button className="btn btn-primary" disabled={busy || text.trim().length < 10}>{t("auth.send")}</button></div>
        </form>
      ) : (
        <p>
          <Link href={`/login?next=/product/${slug}`} style={{ color: "var(--glow)" }}>{t("auth.login")}</Link> — {t("product.writeReview").toLowerCase()}
        </p>
      )}
      {items.map((r) => (
        <div key={r.id} className="review">
          <div className="row-between">
            <b>{r.author}</b>
            <span className="faint small">{formatDate(r.createdAt, locale)}</span>
          </div>
          <span className="stars" style={{ margin: "6px 0" }}>
            {Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" size={14} fill={i < r.rating} />)}
          </span>
          <p className="muted" style={{ whiteSpace: "pre-line" }}>{r.text}</p>
        </div>
      ))}
    </div>
  );
}
