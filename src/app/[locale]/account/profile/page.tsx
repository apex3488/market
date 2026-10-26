import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { updateProfileAction, verifyEmailAction } from "@/lib/auth-actions";
import { getSessionUser } from "@/lib/session";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale } = await params;
  const { saved } = await searchParams;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);
  const t = await getTranslations("account");

  return (
    <div className="grid gap-8">
      <h1 className="page-title">{t("profile")}</h1>
      <AccountNav locale={locale} />
      {saved ? <p className="text-success">{t("saved")}</p> : null}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-line bg-surface text-2xl">
          {user.displayName.slice(0, 1).toUpperCase()}
        </div>
        <p className="text-muted">{t("avatarHint")}</p>
      </div>
      <form action={updateProfileAction} className="grid max-w-md gap-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("name")}</span>
          <input className="field" name="displayName" defaultValue={user.displayName} required />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("phone")}</span>
          <input className="field" name="phone" defaultValue={user.phone} />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          <span>{t("newPassword")}</span>
          <input className="field" name="password" type="password" minLength={6} />
        </label>
        <button type="submit" className="btn w-fit">
          {t("save")}
        </button>
      </form>
      {!user.emailVerified ? (
        <form action={verifyEmailAction}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="btn btn-ghost">
            {t("verify")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
