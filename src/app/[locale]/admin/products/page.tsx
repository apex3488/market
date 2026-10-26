import { getTranslations, setRequestLocale } from "next-intl/server";
import { adminRepository, catalogRepository } from "@market/data";
import { setProductStatusAction, setStockAction, upsertProductAction } from "@/lib/admin-actions";
import { formatUzs } from "@/lib/format";

export default async function AdminProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const products = await adminRepository.listProducts();
  const brands = await catalogRepository.listBrands();
  const categories = await catalogRepository.listCategories(locale as "ru" | "en");
  const flatCategories = categories.flatMap((category) => [
    { id: category.id, name: category.name },
    ...category.children.map((child) => ({ id: child.slug, name: `${category.name} / ${child.name}` })),
  ]);

  return (
    <div className="grid gap-10">
      <section className="grid gap-4">
        <h2 className="text-2xl tracking-tight">{t("products")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="p-2 font-normal">{t("colTitle")}</th>
                <th className="p-2 font-normal">{t("colStatus")}</th>
                <th className="p-2 font-normal">{t("colStock")}</th>
                <th className="p-2 font-normal">{t("colPrice")}</th>
                <th className="p-2 font-normal">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variant = product.variants[0];
                return (
                  <tr key={product.slug} className="border-b border-line align-top">
                    <td className="p-2">
                      <p>{product.title}</p>
                      <p className="text-muted">{product.slug}</p>
                    </td>
                    <td className="p-2">{product.status}</td>
                    <td className="p-2">
                      {variant ? (
                        <form action={setStockAction} className="flex gap-2">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="variantId" value={variant.id} />
                          <input className="field w-20" type="number" name="stockQuantity" defaultValue={variant.stockQuantity} min={0} />
                          <button type="submit" className="btn btn-ghost">
                            {t("save")}
                          </button>
                        </form>
                      ) : null}
                    </td>
                    <td className="p-2">{formatUzs(locale, product.priceUzs)}</td>
                    <td className="p-2">
                      <form action={setProductStatusAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="slug" value={product.slug} />
                        <input type="hidden" name="status" value={product.status === "published" ? "draft" : "published"} />
                        <button type="submit" className="btn btn-ghost">
                          {product.status === "published" ? t("unpublish") : t("publish")}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid max-w-xl gap-4">
        <h2 className="text-2xl tracking-tight">{t("createProduct")}</h2>
        <form action={upsertProductAction} className="grid gap-3">
          <input type="hidden" name="locale" value={locale} />
          <label className="grid gap-1 text-sm text-muted">
            slug
            <input className="field" name="slug" required />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            {t("brand")}
            <select className="field" name="brandId" required>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-muted">
            {t("category")}
            <select className="field" name="categoryId" required>
              {flatCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-muted">
            title RU
            <input className="field" name="titleRu" required />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            title EN
            <input className="field" name="titleEn" required />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            description RU
            <textarea className="field min-h-20 py-2" name="descriptionRu" required />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            description EN
            <textarea className="field min-h-20 py-2" name="descriptionEn" required />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            {t("colPrice")}
            <input className="field" type="number" name="priceUzs" required min={0} />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            {t("colStock")}
            <input className="field" type="number" name="stockQuantity" required min={0} />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            image path
            <input className="field" name="image" defaultValue="/demo/phone.jpg" />
          </label>
          <label className="grid gap-1 text-sm text-muted">
            {t("colStatus")}
            <select className="field" name="status" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" />
            featured
          </label>
          <button type="submit" className="btn w-fit">
            {t("save")}
          </button>
        </form>
      </section>
    </div>
  );
}
