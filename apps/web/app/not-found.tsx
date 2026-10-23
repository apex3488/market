import Link from "next/link";
import { getT } from "@/lib/i18n-server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="container section">
      <div className="empty">
        <h1 style={{ fontSize: 72, color: "var(--glow)" }}>404</h1>
        <h3>{t("err.not_found")}</h3>
        <Link href="/catalog" className="btn btn-primary">{t("hero.cta")}</Link>
      </div>
    </div>
  );
}
