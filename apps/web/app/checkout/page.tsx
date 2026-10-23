"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError, errorText, formatPrice, img, type DeliveryMethod, type PublicConfig, type Quote, type TKey } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";
import { api } from "@/lib/api";

type Form = { customerName: string; phone: string; email: string; city: string; address: string; comment: string };

export default function CheckoutPage() {
  const { t, locale, user, userLoaded, cart, refreshCart, toast } = useStore();
  const router = useRouter();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMethod>("courier");
  const [payment, setPayment] = useState("cod");
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [form, setForm] = useState<Form>({ customerName: "", phone: "", email: "", city: locale === "ru" ? "Ташкент" : "Tashkent", address: "", comment: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  // One key per checkout attempt: a double click or network retry can't create two orders.
  const idemKey = useRef(`web-${crypto.randomUUID()}`);

  useEffect(() => {
    api.config().then((c) => {
      setConfig(c);
      setPayment(c.paymentMethods[0]?.id ?? "cod");
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, customerName: f.customerName || user.name, phone: f.phone || user.phone || "", email: f.email || user.email || "" }));
  }, [user]);

  useEffect(() => {
    if (!cart?.count) return;
    api.quote(delivery, appliedPromo).then(setQuote).catch(() => undefined);
  }, [delivery, appliedPromo, cart]);

  if (userLoaded && !user) {
    return (
      <div className="container section">
        <div className="empty">
          <div className="ic"><Icon name="user" size={28} /></div>
          <h3>{t("checkout.title")}</h3>
          <p className="muted">{t("checkout.loginRequired")}</p>
          <div className="row" style={{ justifyContent: "center" }}>
            <Link href="/login?next=/checkout" className="btn btn-primary">{t("auth.login")}</Link>
            <Link href="/register?next=/checkout" className="btn btn-ghost">{t("auth.register")}</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!cart || !userLoaded) return <div className="container section"><div className="skel" style={{ height: 420 }} /></div>;
  if (!cart.count) {
    return (
      <div className="container section">
        <div className="empty">
          <h3>{t("cart.empty")}</h3>
          <Link href="/catalog" className="btn btn-primary">{t("hero.cta")}</Link>
        </div>
      </div>
    );
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: "" }));
  };
  const err = (k: string) => (errors[k] ? errorText(locale, errors[k]) : "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const res = await api.createOrder(
        { ...form, deliveryMethod: delivery, paymentMethod: payment as "cod", promoCode: appliedPromo, client: "web", locale },
        idemKey.current,
      );
      await refreshCart();
      toast(t("checkout.success", { n: res.order.number }));
      router.push(`/orders/${res.order.id}?new=1`);
    } catch (e2) {
      if (e2 instanceof ApiError) {
        if (e2.fields) setErrors(e2.fields);
        setFormError(errorText(locale, e2.code));
        if (e2.code === "out_of_stock") refreshCart();
      } else setFormError(errorText(locale, "internal"));
    } finally {
      setBusy(false);
    }
  };

  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code) return setAppliedPromo(undefined);
    const q = await api.quote(delivery, code).catch(() => null);
    if (q?.promoError) {
      setErrors((x) => ({ ...x, promoCode: q.promoError! }));
      setAppliedPromo(undefined);
    } else {
      setErrors((x) => ({ ...x, promoCode: "" }));
      setAppliedPromo(code);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <nav className="crumbs"><Link href="/cart">{t("cart.title")}</Link> / <span>{t("checkout.title")}</span></nav>
        <h1>{t("checkout.title")}</h1>
      </div>
      <form className="two-col" onSubmit={submit} noValidate>
        <div className="stack" style={{ gap: 18 }}>
          <section className="panel">
            <h3 style={{ marginBottom: 16 }}>{t("checkout.contact")}</h3>
            <div className="form-grid">
              <Field label={t("checkout.name")} error={err("customerName")}>
                <input className="input" value={form.customerName} onChange={set("customerName")} autoComplete="name" required />
              </Field>
              <Field label={t("checkout.phone")} error={err("phone")}>
                <input className="input" value={form.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" placeholder="+998 90 123 45 67" required />
              </Field>
              <Field label={t("checkout.email")} error={err("email")} full>
                <input className="input" value={form.email} onChange={set("email")} autoComplete="email" type="email" />
              </Field>
            </div>
          </section>

          <section className="panel">
            <h3 style={{ marginBottom: 16 }}>{t("checkout.delivery")}</h3>
            <div className="stack" style={{ gap: 10 }}>
              {(config?.delivery ?? [{ method: "courier", fee: 0 }, { method: "pickup", fee: 0 }]).map((d) => (
                <label key={d.method} className="radio-card">
                  <input type="radio" name="delivery" checked={delivery === d.method} onChange={() => setDelivery(d.method)} />
                  <Icon name={d.method === "courier" ? "truck" : "pin"} size={20} />
                  <span className="grow">{t(`delivery.${d.method}` as TKey)}</span>
                  <b className="small">{d.fee ? formatPrice(d.fee, config?.currency ?? cart.currency, locale) : t("delivery.free")}</b>
                </label>
              ))}
            </div>
            <div className="form-grid" style={{ marginTop: 16 }}>
              <Field label={t("checkout.city")} error={err("city")}>
                <input className="input" value={form.city} onChange={set("city")} autoComplete="address-level2" required />
              </Field>
              {delivery === "courier" && (
                <Field label={t("checkout.address")} error={err("address")}>
                  <input className="input" value={form.address} onChange={set("address")} autoComplete="street-address" required />
                </Field>
              )}
              <Field label={t("checkout.comment")} full>
                <textarea className="textarea" value={form.comment} onChange={set("comment")} maxLength={500} />
              </Field>
            </div>
          </section>

          <section className="panel">
            <h3 style={{ marginBottom: 16 }}>{t("checkout.payment")}</h3>
            <div className="stack" style={{ gap: 10 }}>
              {(config?.paymentMethods ?? [{ id: "cod", testMode: false }]).map((m) => (
                <label key={m.id} className="radio-card">
                  <input type="radio" name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} />
                  <Icon name="package" size={20} />
                  <span className="grow">{t(`pay.${m.id}` as TKey)}</span>
                </label>
              ))}
            </div>
            <p className="faint small" style={{ marginTop: 10 }}>{t("pay.noneOnline")}</p>
          </section>
        </div>

        <aside className="panel sticky">
          <h3 style={{ marginBottom: 14 }}>{t("checkout.summary")}</h3>
          <div className="stack" style={{ gap: 10, marginBottom: 14 }}>
            {cart.items.map((l) => (
              <div key={l.variantId} className="row" style={{ alignItems: "flex-start" }}>
                {l.image && <img src={img(l.image, 100)} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />}
                <div className="grow small" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{l.name}</div>
                  <div className="faint">{l.variantName} · ×{l.quantity}</div>
                </div>
                <span className="small">{formatPrice(l.lineTotal, cart.currency, locale)}</span>
              </div>
            ))}
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" placeholder={t("checkout.promo")} value={promo} onChange={(e) => setPromo(e.target.value)} style={{ height: 40 }} aria-label={t("checkout.promo")} />
              <button type="button" className="btn btn-ghost btn-sm" style={{ height: 40 }} onClick={applyPromo}>{t("checkout.applyPromo")}</button>
            </div>
            {err("promoCode") && <span className="err">{err("promoCode")}</span>}
            {appliedPromo && quote?.promoCode && <span className="small" style={{ color: "var(--success)" }}><Icon name="check" size={14} /> {appliedPromo}</span>}
          </div>
          {quote && (
            <>
              <div className="summary-row"><span className="muted">{t("cart.subtotal")}</span><span>{formatPrice(quote.subtotal, quote.currency, locale)}</span></div>
              {quote.discount > 0 && <div className="summary-row"><span className="muted">{t("checkout.discount")}</span><span style={{ color: "var(--success)" }}>−{formatPrice(quote.discount, quote.currency, locale)}</span></div>}
              <div className="summary-row"><span className="muted">{t("checkout.deliveryFee")}</span><span>{quote.deliveryFee ? formatPrice(quote.deliveryFee, quote.currency, locale) : t("delivery.free")}</span></div>
              <div className="summary-row total"><span>{t("checkout.total")}</span><span>{formatPrice(quote.total, quote.currency, locale)}</span></div>
            </>
          )}
          {formError && <div className="alert alert-error" style={{ marginTop: 14 }}>{formError}</div>}
          <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 16 }} disabled={busy}>
            {busy ? t("common.loading") : t("checkout.place")}
          </button>
          <p className="faint small" style={{ marginTop: 12 }}>
            {t("checkout.agree")} <Link href="/terms" style={{ textDecoration: "underline" }}>{t("nav.terms")}</Link>
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, error, full, children }: { label: string; error?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`field ${error ? "error" : ""} ${full ? "full" : ""}`}>
      <label>{label}</label>
      {children}
      {error && <span className="err">{error}</span>}
    </div>
  );
}
