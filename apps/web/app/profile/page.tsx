"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate, formatPrice, img, type Order, type TKey } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { t, locale, user, userLoaded, setUser, setLocale, logout, toast, errorMessage } = useStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (userLoaded && !user) router.replace("/login?next=/profile");
    if (user) {
      setName(user.name);
      api.orders().then(setOrders).catch(() => setOrders([]));
    }
  }, [user, userLoaded, router]);

  if (!user) return <div className="container section"><div className="skel" style={{ height: 300 }} /></div>;

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api.updateMe({ name });
      setUser(r.user);
      toast(t("admin.saved"));
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <div className="container">
      <div className="page-head row-between" style={{ flexWrap: "wrap" }}>
        <div>
          <h1>{t("profile.hello", { name: user.name.split(" ")[0] })}</h1>
          <p className="muted">{user.email ?? user.phone}</p>
        </div>
        <div className="row">
          {user.role === "admin" && <Link href="/admin" className="btn btn-ghost"><Icon name="chart" size={18} /> {t("nav.admin")}</Link>}
          <button className="btn btn-ghost" onClick={logout}><Icon name="logout" size={18} /> {t("auth.logout")}</button>
        </div>
      </div>
      <div className="two-col">
        <section>
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>{t("profile.orders")}</h2>
          {!orders ? (
            <div className="skel" style={{ height: 200 }} />
          ) : orders.length === 0 ? (
            <div className="empty">
              <div className="ic"><Icon name="package" size={28} /></div>
              <h3>{t("profile.noOrders")}</h3>
              <Link href="/catalog" className="btn btn-primary">{t("hero.cta")}</Link>
            </div>
          ) : (
            <div className="stack">
              {orders.map((o) => (
                <Link key={o.id} href={`/orders/${o.id}`} className="card order-row">
                  <div>
                    <div className="row" style={{ flexWrap: "wrap" }}>
                      <b>{o.number}</b>
                      <span className={`status ${o.status}`}>{t(`status.${o.status}` as TKey)}</span>
                    </div>
                    <div className="faint small" style={{ marginTop: 4 }}>{formatDate(o.createdAt, locale)} · {o.items.reduce((a, i) => a + i.quantity, 0)} {locale === "ru" ? "шт." : "pcs"}</div>
                    <div className="thumbs-row">
                      {o.items.slice(0, 5).map((i, k) => i.image && <img key={k} src={img(i.image, 100)} alt="" />)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <b className="price" style={{ fontSize: 17 }}>{formatPrice(o.total, o.currency, locale)}</b>
                    <div style={{ marginTop: 8, color: "var(--glow)" }}><Icon name="chevron" size={18} /></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <aside className="stack">
          <form className="panel stack" onSubmit={saveName}>
            <h3>{t("nav.settings")}</h3>
            <label className="field">
              <span className="small muted">{t("auth.name")}</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} />
            </label>
            <button className="btn btn-ghost" disabled={name.trim().length < 2 || name === user.name}>{t("common.save")}</button>
            <div className="field">
              <span className="small muted">{t("nav.language")}</span>
              <div className="seg">
                <button type="button" className={locale === "ru" ? "active" : ""} onClick={() => setLocale("ru")}>Русский</button>
                <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>English</button>
              </div>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
