import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductCard as ProductCardData } from "@market/data";
import { formatUzs } from "@/lib/format";
import { Badge } from "./ui";

export async function ProductCard({ product, locale }: { product: ProductCardData; locale: string }) {
  const t = await getTranslations("product");

  return (
    <Link href={`/p/${product.slug}`} className="card">
      <div className="relative aspect-[4/3] bg-raised">
        <Image
          src={product.image}
          alt={t("photoAlt", { title: product.title })}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="grid gap-2 px-4 pb-4">
        <p className="text-sm text-muted">{product.brandName}</p>
        <h3 className="text-lg leading-snug">{product.title}</h3>
        <p>
          {t("from")} {formatUzs(locale, product.priceUzs)}
        </p>
        <div>
          <Badge tone={product.stockQuantity > 0 ? "ok" : "no"}>
            {product.stockQuantity > 0 ? t("inStock") : t("outOfStock")}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
