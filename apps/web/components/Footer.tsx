import Link from "next/link";
import type { Category, TKey } from "@bayhan/shared";

export function Footer({ t, categories }: { t: (k: TKey) => string; categories: Category[] }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo">
              <span className="logo-mark">B</span>
              <span>BAYHAN<small>MARKET</small></span>
            </Link>
            <p className="muted" style={{ marginTop: 16, maxWidth: 340, fontSize: 14 }}>{t("brand.slogan")}</p>
            <p className="faint small" style={{ marginTop: 12, maxWidth: 340 }}>{t("topbar.text")}</p>
          </div>
          <div>
            <h4>{t("nav.catalog")}</h4>
            <ul>
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}><Link href={`/catalog/${c.slug}`}>{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{t("nav.profile")}</h4>
            <ul>
              <li><Link href="/profile">{t("nav.orders")}</Link></li>
              <li><Link href="/favorites">{t("nav.favorites")}</Link></li>
              <li><Link href="/compare">{t("nav.compare")}</Link></li>
              <li><Link href="/cart">{t("nav.cart")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>BAYHAN MARKET</h4>
            <ul>
              <li><Link href="/delivery">{t("nav.delivery")}</Link></li>
              <li><Link href="/returns">{t("nav.returns")}</Link></li>
              <li><Link href="/contacts">{t("nav.contacts")}</Link></li>
              <li><Link href="/privacy">{t("nav.privacy")}</Link></li>
              <li><Link href="/terms">{t("nav.terms")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BAYHAN MARKET</span>
          <span>Photos: Unsplash</span>
        </div>
      </div>
    </footer>
  );
}
