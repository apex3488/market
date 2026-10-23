import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import type { Category } from "@bayhan/shared";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreProvider } from "@/components/StoreProvider";
import { getT } from "@/lib/i18n-server";
import { serverGet } from "@/lib/server-api";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope", weight: ["600", "700", "800"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: `BAYHAN MARKET — ${t("brand.slogan")}`, template: "%s · BAYHAN MARKET" },
    description: t("pas.solution"),
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  };
}

export const viewport: Viewport = { themeColor: "#07090D", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getT();
  const categories = (await serverGet<Category[]>("/categories", locale, 120).catch(() => null)) ?? [];
  return (
    <html lang={locale} className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <StoreProvider initialLocale={locale}>
          <Header categories={categories} />
          <main>{children}</main>
          <Footer t={t} categories={categories} />
        </StoreProvider>
      </body>
    </html>
  );
}
