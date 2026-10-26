import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { userRepository } from "@market/data";
import { AccountNav } from "@/components/account-nav";
import { addAddressAction } from "@/lib/auth-actions";
import { getSessionUser } from "@/lib/session";

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);
  const t = await getTranslations("account");
  const list = await userRepository.listAddresses(user.id);

  return (
    <div className="grid gap-8">
      <h1 className="page-title">{t("addresses")}</h1>
      <AccountNav locale={locale} />
      {list.length === 0 ? <p className="text-muted">{t("addressesEmpty")}</p> : null}
      <ul className="grid gap-3">
        {list.map((address) => (
          <li key={address.id} className="rounded-[16px] border border-line bg-surface p-4">
            <p>{address.recipient}</p>
            <p className="text-muted">
              {address.city}, {address.street}
            </p>
            <p className="text-sm text-muted">{address.phone}</p>
          </li>
        ))}
      </ul>
      <form action={addAddressAction} className="grid max-w-md gap-4">
        <input type="hidden" name="locale" value={locale} />
        <h2 className="text-xl">{t("addAddress")}</h2>
        <input className="field" name="recipient" placeholder={t("recipient")} required />
        <input className="field" name="phone" placeholder={t("phone")} required />
        <input className="field" name="city" placeholder={t("city")} required />
        <input className="field" name="street" placeholder={t("street")} required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDefault" />
          {t("defaultAddress")}
        </label>
        <button type="submit" className="btn w-fit">
          {t("save")}
        </button>
      </form>
    </div>
  );
}
