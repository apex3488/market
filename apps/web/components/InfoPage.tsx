import Link from "next/link";
import type { TKey } from "@bayhan/shared";
import { getT } from "@/lib/i18n-server";

export async function InfoPage({ title, body }: { title: TKey; body: TKey }) {
  const { t } = await getT();
  return (
    <div className="container">
      <div className="page-head">
        <nav className="crumbs"><Link href="/">{t("nav.home")}</Link> / <span>{t(title)}</span></nav>
        <h1>{t(title)}</h1>
      </div>
      <div className="panel prose">
        {t(body).split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
      </div>
    </div>
  );
}

export function infoMeta(title: TKey) {
  return async () => {
    const { t } = await getT();
    return { title: t(title) };
  };
}
