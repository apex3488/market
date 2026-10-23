import type { Metadata } from "next";
import { CatalogPage, type SP } from "@/lib/catalog-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("search.title"), robots: { index: false } };
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  return <CatalogPage search searchParams={await searchParams} />;
}
