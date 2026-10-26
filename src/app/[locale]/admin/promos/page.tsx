import { getTranslations, setRequestLocale } from "next-intl/server";
import { adminRepository } from "@market/data";
import { updatePromoAction } from "@/lib/admin-actions";

export default async function AdminPromosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const promos = await adminRepository.listPromos(locale as "ru" | "en");

  return (
    <div className="grid gap-8">
      <h2 className="text-2xl tracking-tight">{t("promos")}</h2>
      {promos.map((promo) => (
        <form key={promo.id} action={updatePromoAction} className="grid max-w-xl gap-3 border border-line bg-surface p-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={promo.id} />
          <p className="text-sm text-muted">{promo.id}</p>
          <label className="grid gap-1 text-sm text-muted">
            problem
            <input className="field" name="problem" defaultValue={promo.problem} />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            agitate
            <input className="field" name="agitate" defaultValue={promo.agitate} />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            solution
            <input className="field" name="solution" defaultValue={promo.solution} />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            cta
            <input className="field" name="cta" defaultValue={promo.cta} />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            href
            <input className="field" name="href" defaultValue={promo.href} />
          </label>
          <button type="submit" className="btn w-fit">
            {t("save")}
          </button>
        </form>
      ))}
    </div>
  );
}
