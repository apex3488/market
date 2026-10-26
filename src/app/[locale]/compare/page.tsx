import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { catalogRepository } from "@market/data";
import { CompareClient } from "@/components/compare-client";
import { formatUzs } from "@/lib/format";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; slugs?: string }>;
}) {
  const { locale } = await params;
  const { category = "", slugs = "" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("compare");
  const requested = slugs
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
  const products =
    requested.length > 0
      ? await catalogRepository.getBySlugs(locale as "ru" | "en", requested)
      : [];
  const compatible = category
    ? products.filter((product) => product.categorySlug === category)
    : products;
  const sameCategory = compatible.every((product) => product.categorySlug === compatible[0]?.categorySlug);

  return (
    <div className="grid gap-8 py-8">
      <div className="grid gap-2">
        <h1 className="page-title">{t("title")}</h1>
        <p className="max-w-2xl text-muted">{t("hint")}</p>
      </div>
      <CompareClient category={category} />
      {compatible.length === 0 ? <p className="text-muted">{t("empty")}</p> : null}
      {!sameCategory && compatible.length > 0 ? <p className="text-danger">{t("mismatch")}</p> : null}
      {sameCategory && compatible.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-line p-3 text-muted">{t("feature")}</th>
                {compatible.map((product) => (
                  <th key={product.slug} className="border-b border-line p-3 align-top">
                    <div className="grid w-44 gap-2">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-surface">
                        <Image src={product.image} alt="" fill className="object-cover" sizes="176px" />
                      </div>
                      <span>{product.title}</span>
                      <span className="text-sm text-muted">{formatUzs(locale, product.priceUzs)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className="border-b border-line p-3 font-normal text-muted">{t("brand")}</th>
                {compatible.map((product) => (
                  <td key={`${product.slug}-brand`} className="border-b border-line p-3">
                    {product.brandName}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="border-b border-line p-3 font-normal text-muted">{t("stock")}</th>
                {compatible.map((product) => (
                  <td key={`${product.slug}-stock`} className="border-b border-line p-3">
                    {product.stockQuantity}
                  </td>
                ))}
              </tr>
              {(compatible[0]?.specs ?? []).map((spec, index) => (
                <tr key={spec.label}>
                  <th className="border-b border-line p-3 font-normal text-muted">{spec.label}</th>
                  {compatible.map((product) => (
                    <td key={`${product.slug}-${spec.label}`} className="border-b border-line p-3">
                      {product.specs[index]?.value ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
