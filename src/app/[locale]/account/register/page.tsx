import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { registerAction } from "@/lib/auth-actions";
import { getSessionUser } from "@/lib/session";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  if (await getSessionUser()) redirect(`/${locale}/account`);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <h1 className="page-title">{t("registerTitle")}</h1>
      {error === "taken" ? <p className="text-danger">{t("taken")}</p> : null}
      {error === "password" ? <p className="text-danger">{t("passwordShort")}</p> : null}
      <form action={registerAction} className="grid gap-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("name")}</span>
          <input className="field" name="displayName" required />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("email")}</span>
          <input className="field" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("password")}</span>
          <input className="field" name="password" type="password" autoComplete="new-password" required minLength={6} />
        </label>
        <button type="submit" className="btn">
          {t("register")}
        </button>
      </form>
      <Link href="/account/login" className="text-sm text-muted">
        {t("toLogin")}
      </Link>
    </div>
  );
}
