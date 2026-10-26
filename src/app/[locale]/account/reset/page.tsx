import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { resetPasswordAction } from "@/lib/auth-actions";

export default async function ResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <h1 className="page-title">{t("resetTitle")}</h1>
      <p className="text-muted">{t("resetText")}</p>
      {error === "missing" ? <p className="text-danger">{t("missing")}</p> : null}
      {error === "password" ? <p className="text-danger">{t("passwordShort")}</p> : null}
      <form action={resetPasswordAction} className="grid gap-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("email")}</span>
          <input className="field" name="email" type="email" required />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("newPassword")}</span>
          <input className="field" name="password" type="password" required minLength={6} />
        </label>
        <button type="submit" className="btn">
          {t("reset")}
        </button>
      </form>
      <Link href="/account/login" className="text-sm text-muted">
        {t("toLogin")}
      </Link>
    </div>
  );
}
