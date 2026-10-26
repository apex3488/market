"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "./toast";

export function CallbackForm() {
  const t = useTranslations("callback");
  const show = useToast();
  const [error, setError] = useState("");

  return (
    <form
      className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const email = String(data.get("email") ?? "");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError(t("invalid"));
          return;
        }
        setError("");
        window.localStorage.setItem("velin-callback-email", email);
        show(t("toast"));
        event.currentTarget.reset();
      }}
    >
      <div className="grid gap-2">
        <h2 className="font-serif text-4xl leading-none text-balance">{t("title")}</h2>
        <p className="max-w-[36rem] text-muted">{t("text")}</p>
      </div>
      <div className="grid gap-3">
        <label htmlFor="callback-email" className="grid gap-2 text-sm text-muted">
          <span>{t("label")}</span>
          <input id="callback-email" name="email" type="email" autoComplete="email" required className="field" />
        </label>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn w-fit">
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
