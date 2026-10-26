import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { loginAction } from "@/lib/auth-actions";
import { isGoogleConfigured } from "@/lib/google-oauth";
import { getSessionUser } from "@/lib/session";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { locale } = await params;
  const { error, reset } = await searchParams;
  setRequestLocale(locale);
  if (await getSessionUser()) redirect(`/${locale}/account`);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <h1 className="page-title">{t("loginTitle")}</h1>
      {error === "invalid" ? <p className="text-danger">{t("invalid")}</p> : null}
      {error === "google" ? <p className="text-danger">{t("googleError")}</p> : null}
      {reset ? <p className="text-success">{t("resetOk")}</p> : null}
      <form action={loginAction} className="grid gap-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("email")}</span>
          <input className="field" name="email" type="email" autoComplete="email" required defaultValue="buyer@velin.demo" />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("password")}</span>
          <input className="field" name="password" type="password" autoComplete="current-password" required defaultValue="demo1234" />
        </label>
        <button type="submit" className="btn">
          {t("login")}
        </button>
      </form>
      {isGoogleConfigured() ? (
        <a href={`/api/auth/google?locale=${locale}`} className="btn btn-ghost">
          {t("google")}
        </a>
      ) : (
        <>
          <button type="button" className="btn btn-ghost" disabled title={t("googleHint")}>
            {t("google")}
          </button>
          <p className="text-sm text-muted">{t("googleHint")}</p>
        </>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/account/register">{t("toRegister")}</Link>
        <Link href="/account/reset">{t("toReset")}</Link>
      </div>
    </div>
  );
}
