"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice, img, type Category, type ProductCard } from "@bayhan/shared";
import { api } from "@/lib/api";
import { Icon } from "./Icon";
import { useStore } from "./StoreProvider";

export function Header({ categories }: { categories: Category[] }) {
  const { t, locale, setLocale, cart, user, favIds, compareIds, cartBump } = useStore();
  const [megaOpen, setMegaOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMegaOpen(false), [pathname]);

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span className="hide-mobile">{t("topbar.text")}</span>
          <nav>
            <Link href="/delivery" className="hide-mobile">{t("nav.delivery")}</Link>
            <Link href="/returns" className="hide-mobile">{t("nav.returns")}</Link>
            <Link href="/contacts">{t("nav.contacts")}</Link>
            <button
              onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
              style={{ background: "none", border: 0, padding: 0, display: "inline-flex", gap: 6, alignItems: "center", color: "inherit", fontSize: "inherit" }}
              aria-label={t("nav.language")}
            >
              <Icon name="globe" size={14} /> {locale === "ru" ? "RU · EN" : "EN · RU"}
            </button>
          </nav>
        </div>
      </div>
      <header className="header">
        <div className="container">
          <Link href="/" className="logo" aria-label="BAYHAN MARKET">
            <span className="logo-mark">B</span>
            <span>
              BAYHAN
              <small>MARKET</small>
            </span>
          </Link>
          <button className="btn btn-primary catalog-btn" onClick={() => setMegaOpen((v) => !v)} aria-expanded={megaOpen}>
            <Icon name={megaOpen ? "close" : "grid"} size={18} />
            <span className="hide-mobile">{t("nav.catalog")}</span>
          </button>
          <SearchBox />
          <div className="header-actions">
            <Link href="/compare" className="icon-btn hide-mobile" aria-label={t("nav.compare")}>
              <Icon name="compare" size={22} />
              {compareIds.length > 0 && <span className="badge">{compareIds.length}</span>}
              <span className="lbl">{t("nav.compare")}</span>
            </Link>
            <Link href="/favorites" className="icon-btn" aria-label={t("nav.favorites")}>
              <Icon name="heart" size={22} />
              {favIds.size > 0 && <span className="badge">{favIds.size}</span>}
              <span className="lbl">{t("nav.favorites")}</span>
            </Link>
            <Link href="/cart" className="icon-btn" aria-label={t("nav.cart")} data-cart-target>
              <Icon name="cart" size={22} />
              {!!cart?.count && <span key={cartBump} className={`badge ${cartBump ? "bump" : ""}`}>{cart.count}</span>}
              <span className="lbl">{t("nav.cart")}</span>
            </Link>
            <Link href={user ? "/profile" : "/login"} className="icon-btn" aria-label={t("nav.profile")}>
              <Icon name="user" size={22} />
              <span className="lbl">{user ? user.name.split(" ")[0] : t("auth.login")}</span>
            </Link>
          </div>
        </div>
        {megaOpen && (
          <>
            <div className="mega">
              <div className="container">
                {categories.map((c) => (
                  <Link key={c.id} href={`/catalog/${c.slug}`}>
                    <span className="ic"><Icon name={c.icon} size={20} /></span>
                    <span>
                      <b style={{ display: "block", fontSize: 14 }}>{c.name}</b>
                      <span className="faint small">{c.productCount ?? 0}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </header>
      {megaOpen && <div className="overlay" style={{ zIndex: 40 }} onClick={() => setMegaOpen(false)} />}
    </>
  );
}

function SearchBox() {
  const { t, locale } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ProductCard[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const id = setTimeout(() => {
      api.suggest(q.trim()).then((r) => {
        setItems(r);
        setActive(-1);
      }).catch(() => setItems([]));
    }, 180);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    if (active >= 0 && items[active]) router.push(`/product/${items[active].slug}`);
    else if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="search" ref={box}>
      <form onSubmit={submit} role="search">
        <Icon name="search" size={18} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(items.length - 1, a + 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(-1, a - 1));
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={t("search.placeholder")}
          aria-label={t("nav.search")}
          autoComplete="off"
        />
      </form>
      {open && items.length > 0 && (
        <div className="suggest">
          {items.map((p, i) => (
            <Link key={p.id} href={`/product/${p.slug}`} className={i === active ? "active" : ""} onClick={() => setOpen(false)}>
              {p.image && <img src={img(p.image, 120)} alt="" />}
              <span className="grow">
                <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                <span className="faint small">{p.category.name}</span>
              </span>
              <b style={{ fontSize: 14, whiteSpace: "nowrap" }}>{formatPrice(p.price, p.currency, locale)}</b>
            </Link>
          ))}
          <Link href={`/search?q=${encodeURIComponent(q)}`} onClick={() => setOpen(false)} style={{ color: "var(--glow)", fontSize: 13.5, fontWeight: 600 }}>
            {t("search.results", { q })} <Icon name="arrow" size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
