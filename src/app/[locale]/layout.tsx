import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { catalogRepository } from "@market/data";
import { routing } from "@/i18n/routing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/toast";
import { getSessionUser } from "@/lib/session";
import "../globals.css";

const sans = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist",
});

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const languages = Object.fromEntries(routing.locales.map((item) => [item, `/${item}`]));
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { ...languages, "x-default": "/ru" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("nav");
  const tDemo = await getTranslations("demo");
  const categories = await catalogRepository.listCategories(locale);
  const user = await getSessionUser();

  return (
    <html lang={locale} data-motion="luxury" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-dvh bg-bg font-sans text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <a className="skip" href="#content">
              {t("skip")}
            </a>
            <p className="border-b border-line bg-raised px-4 py-2 text-center text-sm text-muted">{tDemo("banner")}</p>
            <SiteHeader locale={locale} categories={categories} user={user} />
            <main id="content" className="mx-auto max-w-7xl px-4">
              {children}
            </main>
            <SiteFooter categories={categories} />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
