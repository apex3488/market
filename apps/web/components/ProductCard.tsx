"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { discountPercent, formatPrice, img, type ProductCard as P } from "@bayhan/shared";
import { Icon } from "./Icon";
import { useStore } from "./StoreProvider";

export function ProductCard({ p, priority }: { p: P; priority?: boolean }) {
  const { t, locale, addToCart, favIds, toggleFavorite, compareIds, toggleCompare } = useStore();
  const media = useRef<HTMLAnchorElement>(null);
  const [done, setDone] = useState(false);
  const off = discountPercent(p.price, p.compareAtPrice);
  const fav = favIds.has(p.id);
  const cmp = compareIds.includes(p.id);

  const add = async () => {
    if (!p.defaultVariantId) return;
    if (await addToCart(p.defaultVariantId, 1, media.current)) {
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    }
  };

  return (
    <article className="pcard">
      <Link href={`/product/${p.slug}`} className="media" ref={media} aria-label={p.name}>
        {p.image ? <img src={img(p.image, 480)} alt={p.name} loading={priority ? "eager" : "lazy"} /> : null}
      </Link>
      <div className="tags">
        {p.isNew && <span className="tag tag-new">{t("product.new")}</span>}
        {off && <span className="tag tag-sale">−{off}%</span>}
      </div>
      <div className="quick">
        <button className={`round-btn ${fav ? "on" : ""}`} onClick={() => toggleFavorite(p.id)} aria-label={fav ? t("product.inFavorites") : t("product.favorite")} aria-pressed={fav}>
          <Icon name="heart" size={17} fill={fav} />
        </button>
        <button className={`round-btn ${cmp ? "on-blue" : ""}`} onClick={() => toggleCompare(p.id)} aria-label={cmp ? t("product.inCompare") : t("product.compare")} aria-pressed={cmp}>
          <Icon name="compare" size={17} />
        </button>
      </div>
      <div className="body">
        <span className="brand">{p.brand.name}</span>
        <Link href={`/product/${p.slug}`} className="name">{p.name}</Link>
        {p.keySpecs.length > 0 && <span className="specs">{p.keySpecs.map((s) => s.value).join(" · ")}</span>}
        <span className={`stock ${p.inStock ? "" : "out"}`}>{p.inStock ? t("product.inStock") : t("product.outOfStock")}</span>
        <div className="bottom">
          <div>
            {p.compareAtPrice && <div className="price-old">{formatPrice(p.compareAtPrice, p.currency, locale)}</div>}
            <div className="price">{formatPrice(p.price, p.currency, locale)}</div>
          </div>
          <button className={`add-btn ${done ? "done" : ""}`} onClick={add} disabled={!p.inStock || !p.defaultVariantId} aria-label={t("product.addToCart")}>
            <Icon name={done ? "check" : "cart"} size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="pcard">
      <div className="media skel" style={{ borderRadius: 0 }} />
      <div className="body">
        <div className="skel" style={{ height: 12, width: "40%" }} />
        <div className="skel" style={{ height: 16, width: "90%" }} />
        <div className="skel" style={{ height: 16, width: "60%" }} />
        <div className="skel" style={{ height: 24, width: "50%", marginTop: 12 }} />
      </div>
    </div>
  );
}
