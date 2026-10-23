import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Category } from "@bayhan/shared";
import { CatalogPage, type SP } from "@/lib/catalog-page";
import { getLocale } from "@/lib/i18n-server";
import { serverGet } from "@/lib/server-api";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<SP> };

async function findCategory(slug: string) {
  const cats = await serverGet<Category[]>("/categories", await getLocale(), 120);
  return cats?.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await findCategory((await params).category);
  return { title: cat?.name };
}

export default async function Page({ params, searchParams }: Props) {
  const { category } = await params;
  if (!(await findCategory(category))) notFound();
  return <CatalogPage category={category} searchParams={await searchParams} />;
}
