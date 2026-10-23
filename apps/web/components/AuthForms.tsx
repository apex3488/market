"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiError, errorText } from "@bayhan/shared";
import { api, cartToken } from "@/lib/api";
import { useStore } from "./StoreProvider";

function useNext() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/profile";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

function Field(props: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className={`field ${props.error ? "error" : ""}`}>
      <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 550 }}>{props.label}</span>
      {props.children}
      {props.error && <span className="err">{props.error}</span>}
    </label>
  );
}

export function LoginForm() {
  const { t, locale, setUser, refreshCart } = useStore();
  const router = useRouter();
  const next = useNext();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.login(identifier, password, cartToken.get());
      cartToken.clear();
      setUser(r.user);
      await refreshCart();
      router.push(next);
      router.refresh();
    } catch (e2) {
      setError(errorText(locale, e2 instanceof ApiError ? e2.code : "internal"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel auth-card stack" style={{ gap: 16 }} onSubmit={submit}>
      <div>
        <h1>{t("auth.login")}</h1>
        <p className="muted">{t("brand.slogan")}</p>
      </div>
      <Field label={t("auth.identifier")}>
        <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
      </Field>
      <Field label={t("auth.password")}>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </Field>
      {error && <div className="alert alert-error">{error}</div>}
      <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? t("common.loading") : t("auth.submitLogin")}</button>
      <div className="row-between small">
        <Link href="/forgot-password" className="muted">{t("auth.forgot")}</Link>
        <span className="muted">
          {t("auth.noAccount")} <Link href={`/register?next=${encodeURIComponent(next)}`} style={{ color: "var(--glow)" }}>{t("auth.register")}</Link>
        </span>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const { t, locale, setUser, refreshCart } = useStore();
  const router = useRouter();
  const next = useNext();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const fe = (k: string) => (errors[k] ? errorText(locale, errors[k]) : undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setErrors({});
    try {
      const r = await api.register({ ...f, locale, cartToken: cartToken.get() ?? undefined });
      cartToken.clear();
      setUser(r.user);
      await refreshCart();
      router.push(next);
      router.refresh();
    } catch (e2) {
      if (e2 instanceof ApiError && e2.fields) setErrors(e2.fields);
      setError(errorText(locale, e2 instanceof ApiError ? e2.code : "internal"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel auth-card stack" style={{ gap: 14 }} onSubmit={submit} noValidate>
      <div>
        <h1>{t("auth.register")}</h1>
        <p className="muted">{t("home.adv3.d")}</p>
      </div>
      <Field label={t("auth.name")} error={fe("name")}>
        <input className="input" value={f.name} onChange={set("name")} autoComplete="name" required />
      </Field>
      <Field label={t("auth.email")} error={fe("email")}>
        <input className="input" type="email" value={f.email} onChange={set("email")} autoComplete="email" />
      </Field>
      <Field label={t("auth.phone")} error={fe("phone")}>
        <input className="input" type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="+998 90 123 45 67" />
      </Field>
      <p className="faint small" style={{ marginTop: -6 }}>{t("auth.emailOrPhone")}</p>
      <Field label={t("auth.password")} error={fe("password")}>
        <input className="input" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" minLength={8} required />
      </Field>
      {error && <div className="alert alert-error">{error}</div>}
      <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? t("common.loading") : t("auth.submitRegister")}</button>
      <p className="small muted" style={{ textAlign: "center" }}>
        {t("auth.haveAccount")} <Link href={`/login?next=${encodeURIComponent(next)}`} style={{ color: "var(--glow)" }}>{t("auth.login")}</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const { t } = useStore();
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await api.forgot(identifier).catch(() => undefined);
    setSent(true);
    setBusy(false);
  };
  return (
    <form className="panel auth-card stack" style={{ gap: 16 }} onSubmit={submit}>
      <h1>{t("auth.forgotTitle")}</h1>
      {sent ? (
        <div className="alert alert-ok">{t("auth.forgotSent")}</div>
      ) : (
        <>
          <Field label={t("auth.identifier")}>
            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </Field>
          <button className="btn btn-primary btn-lg" disabled={busy}>{t("auth.send")}</button>
        </>
      )}
      <Link href="/login" className="small muted">← {t("auth.login")}</Link>
    </form>
  );
}

export function ResetForm() {
  const { t, locale } = useStore();
  const sp = useSearchParams();
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "done">("idle");
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.reset(sp.get("token") ?? "", password);
      setState("done");
    } catch (e2) {
      setError(errorText(locale, e2 instanceof ApiError ? (e2.fields?.password ?? e2.code) : "internal"));
    }
  };
  return (
    <form className="panel auth-card stack" style={{ gap: 16 }} onSubmit={submit}>
      <h1>{t("auth.resetTitle")}</h1>
      {state === "done" ? (
        <>
          <div className="alert alert-ok">{t("auth.resetDone")}</div>
          <Link href="/login" className="btn btn-primary">{t("auth.login")}</Link>
        </>
      ) : (
        <>
          <Field label={t("auth.password")}>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
          </Field>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary btn-lg">{t("auth.save")}</button>
        </>
      )}
    </form>
  );
}
