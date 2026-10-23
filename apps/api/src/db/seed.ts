import { eq } from "drizzle-orm";
import { env } from "../env";
import { createDb, schema as s } from "./client";
import { brands, categories, products } from "./seed-data";

/**
 * Idempotent demo seed: categories and brands are upserted by slug; a product is inserted only
 * if its slug does not exist yet, so admin edits are never overwritten. Safe to run repeatedly.
 */
const handle = await createDb(env.DATABASE_URL);
if (env.DATABASE_URL.startsWith("pglite:")) await handle.migrate();
const db = handle.db;
const currency = env.STORE_CURRENCY;
const minor = (whole: number) => whole * 100;

for (const [i, c] of categories.entries()) {
  await db.insert(s.categories).values({ ...c, sortOrder: i }).onConflictDoUpdate({
    target: s.categories.slug,
    set: { nameRu: c.nameRu, nameEn: c.nameEn, icon: c.icon, imageUrl: c.imageUrl, specFilters: c.specFilters, sortOrder: i },
  });
}
for (const b of brands) {
  await db.insert(s.brands).values(b).onConflictDoUpdate({ target: s.brands.slug, set: { name: b.name } });
}
const catIds = new Map((await db.select().from(s.categories)).map((c) => [c.slug, c.id]));
const brandIds = new Map((await db.select().from(s.brands)).map((b) => [b.slug, b.id]));

let created = 0;
for (const [pi, p] of products.entries()) {
  const categoryId = catIds.get(p.category);
  const brandId = brandIds.get(p.brand);
  if (!categoryId || !brandId) throw new Error(`Unknown category/brand for ${p.slug}`);
  await db.transaction(async (tx) => {
    const ins = await tx.insert(s.products).values({
      slug: p.slug, name: p.name, categoryId, brandId, descriptionRu: p.ru, descriptionEn: p.en,
      isNew: !!p.isNew, isFeatured: !!p.isFeatured, popularity: products.length - pi,
    }).onConflictDoNothing({ target: s.products.slug }).returning({ id: s.products.id });
    if (!ins.length) return;
    const productId = ins[0]!.id;
    created++;
    await tx.insert(s.productImages).values(p.images.map((url, i) => ({ productId, url, alt: p.name, sortOrder: i })));
    await tx.insert(s.productSpecs).values(p.specs.map(([key, labelRu, labelEn, value], i) => ({ productId, key, labelRu, labelEn, value, sortOrder: i })));
    for (const [vi, v] of p.variants.entries()) {
      const sku = `BM-${p.slug}-${vi + 1}`.toUpperCase().slice(0, 60);
      const [variant] = await tx.insert(s.productVariants).values({
        productId, sku, name: v.name, options: v.options ?? {}, price: minor(v.price),
        compareAtPrice: v.compareAt ? minor(v.compareAt) : null, currency, isDefault: vi === 0, sortOrder: vi,
      }).returning({ id: s.productVariants.id });
      await tx.insert(s.inventory).values({ variantId: variant!.id, quantity: v.stock });
    }
  });
}

const existingPromo = await db.select().from(s.promotions).where(eq(s.promotions.code, "DEMO5")).limit(1);
if (!existingPromo.length) {
  await db.insert(s.promotions).values({ code: "DEMO5", kind: "percent", value: 5, minSubtotal: minor(1_000_000) });
}

console.log(`Seed done: ${categories.length} categories, ${brands.length} brands, ${created} new products.`);
await handle.close();
