import type { MetadataRoute } from "next";
import { catalogRepository } from "@market/data";
import { routing } from "@/i18n/routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [];
  const info = ["about", "delivery", "warranty", "returns", "faq", "contacts", "privacy", "terms"];

  for (const locale of routing.locales) {
    entries.push({ url: `${base}/${locale}`, changeFrequency: "daily", priority: 1 });
    entries.push({ url: `${base}/${locale}/search`, changeFrequency: "weekly", priority: 0.4 });
    entries.push({ url: `${base}/${locale}/compare`, changeFrequency: "weekly", priority: 0.3 });
    for (const slug of info) {
      entries.push({ url: `${base}/${locale}/info/${slug}`, changeFrequency: "monthly", priority: 0.3 });
    }
    const categories = await catalogRepository.listCategories(locale);
    for (const category of categories) {
      entries.push({ url: `${base}/${locale}/c/${category.slug}`, changeFrequency: "daily", priority: 0.8 });
      for (const child of category.children) {
        entries.push({ url: `${base}/${locale}/c/${child.slug}`, changeFrequency: "daily", priority: 0.7 });
      }
    }
    const products = await catalogRepository.listProducts(locale, {
      sort: "new",
      includeDrafts: false,
      page: 1,
      pageSize: 200,
    });
    for (const product of products) {
      entries.push({ url: `${base}/${locale}/p/${product.slug}`, changeFrequency: "weekly", priority: 0.6 });
    }
  }

  return entries;
}
