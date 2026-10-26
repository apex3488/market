"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function LocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {(["ru", "en"] as const).map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          hrefLang={code}
          aria-current={locale === code ? "true" : undefined}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center text-sm ${locale === code ? "text-ink" : "text-muted"}`}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
