import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

const pages = ["about", "delivery", "warranty", "returns", "faq", "contacts"] as const;

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!pages.includes(slug as (typeof pages)[number])) notFound();
  setRequestLocale(locale);
  const footer = await getTranslations("footer");
  const info = await getTranslations("info");
  const key = slug as (typeof pages)[number];

  return (
    <article className="grid max-w-2xl gap-4 py-10">
      <h1 className="page-title">{footer(key)}</h1>
      <p className="text-lg text-muted">{info(key)}</p>
    </article>
  );
}
