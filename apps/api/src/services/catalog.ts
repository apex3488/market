import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import type {
  Category,
  Locale,
  ProductCard,
  ProductDetail,
  ProductListResponse,
  ProductQuery,
  Spec,
  Variant,
} from "@bayhan/shared";
import { PAGE_SIZE } from "@bayhan/shared";
import { db, schema } from "../db/client";
import { num, rawRows } from "../lib/sql";

const s = schema;

export async function listCategories(lang: Locale): Promise<Category[]> {
  const rows = await rawRows<{
    id: string; slug: string; name_ru: string; name_en: string; icon: string; image_url: string | null; spec_filters: string[]; cnt: number;
  }>(sql`
    SELECT c.id, c.slug, c.name_ru, c.name_en, c.icon, c.image_url, c.spec_filters,
      (SELECT count(*)::int FROM products p WHERE p.category_id = c.id AND p.is_active) AS cnt
    FROM categories c ORDER BY c.sort_order, c.name_en`);
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: lang === "en" ? r.name_en : r.name_ru,
    icon: r.icon,
    imageUrl: r.image_url,
    specFilters: r.spec_filters ?? [],
    productCount: num(r.cnt),
  }));
}

export async function listBrands() {
  return db().select({ id: s.brands.id, slug: s.brands.slug, name: s.brands.name, logoUrl: s.brands.logoUrl }).from(s.brands).orderBy(asc(s.brands.name));
}

/** Batch-load product cards for the given ids, preserving order. */
export async function loadCards(ids: string[], lang: Locale): Promise<ProductCard[]> {
  if (!ids.length) return [];
  const base = await db()
    .select({
      p: s.products,
      brandSlug: s.brands.slug,
      brandName: s.brands.name,
      catSlug: s.categories.slug,
      catRu: s.categories.nameRu,
      catEn: s.categories.nameEn,
    })
    .from(s.products)
    .innerJoin(s.brands, eq(s.brands.id, s.products.brandId))
    .innerJoin(s.categories, eq(s.categories.id, s.products.categoryId))
    .where(inArray(s.products.id, ids));

  const variants = await db()
    .select({ v: s.productVariants, qty: s.inventory.quantity, reserved: s.inventory.reserved })
    .from(s.productVariants)
    .leftJoin(s.inventory, eq(s.inventory.variantId, s.productVariants.id))
    .where(and(inArray(s.productVariants.productId, ids), eq(s.productVariants.isActive, true)))
    .orderBy(asc(s.productVariants.sortOrder));

  const images = await rawRows<{ product_id: string; url: string }>(sql`
    SELECT DISTINCT ON (product_id) product_id, url FROM product_images
    WHERE product_id IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})
    ORDER BY product_id, sort_order`);

  const specs = await db()
    .select()
    .from(s.productSpecs)
    .where(inArray(s.productSpecs.productId, ids))
    .orderBy(asc(s.productSpecs.sortOrder));

  const ratings = await rawRows<{ product_id: string; avg: string; cnt: number }>(sql`
    SELECT product_id, avg(rating)::numeric(3,2) AS avg, count(*)::int AS cnt FROM reviews
    WHERE is_published AND product_id IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})
    GROUP BY product_id`);

  const byId = new Map<string, ProductCard>();
  for (const row of base) {
    const vs = variants.filter((v) => v.v.productId === row.p.id);
    const def = vs.find((v) => v.v.isDefault) ?? [...vs].sort((a, b) => a.v.price - b.v.price)[0];
    const stock = vs.reduce((acc, v) => acc + Math.max(0, (v.qty ?? 0) - (v.reserved ?? 0)), 0);
    const r = ratings.find((x) => x.product_id === row.p.id);
    byId.set(row.p.id, {
      id: row.p.id,
      slug: row.p.slug,
      name: row.p.name,
      brand: { slug: row.brandSlug, name: row.brandName },
      category: { slug: row.catSlug, name: lang === "en" ? row.catEn : row.catRu },
      image: images.find((i) => i.product_id === row.p.id)?.url ?? null,
      price: def?.v.price ?? 0,
      compareAtPrice: def?.v.compareAtPrice && def.v.compareAtPrice > def.v.price ? def.v.compareAtPrice : null,
      currency: def?.v.currency ?? "UZS",
      inStock: stock > 0,
      isNew: row.p.isNew,
      defaultVariantId: def?.v.id ?? null,
      keySpecs: specs
        .filter((sp) => sp.productId === row.p.id)
        .slice(0, 3)
        .map((sp) => ({ key: sp.key, label: lang === "en" ? sp.labelEn : sp.labelRu, value: sp.value })),
      rating: r ? { avg: Number(r.avg), count: num(r.cnt) } : null,
    });
  }
  return ids.map((id) => byId.get(id)).filter((x): x is ProductCard => !!x);
}

function parseSpecFilter(raw?: string): { key: string; values: string[] }[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((part) => {
      const [key, vals] = part.split(":");
      return { key: key?.trim() ?? "", values: (vals ?? "").split("|").map((v) => v.trim()).filter(Boolean) };
    })
    .filter((f) => f.key && f.values.length)
    .slice(0, 8);
}

const list = (vals: string[]) => sql.join(vals.map((v) => sql`${v}`), sql`, `);

export async function searchProducts(q: ProductQuery, lang: Locale): Promise<ProductListResponse> {
  const page = q.page ?? 1;
  const pageSize = q.limit ?? PAGE_SIZE;

  // Base scope (category + text) — facets are computed on this scope.
  const scope: SQL[] = [sql`p.is_active`];
  let categorySpecKeys: string[] = [];
  if (q.category) {
    scope.push(sql`c.slug = ${q.category}`);
    const cat = await db().select({ f: s.categories.specFilters }).from(s.categories).where(eq(s.categories.slug, q.category)).limit(1);
    categorySpecKeys = cat[0]?.f ?? [];
  }
  if (q.q) {
    const words = q.q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const w of words) {
      const like = `%${w.replace(/[%_\\]/g, "\\$&")}%`;
      scope.push(sql`(lower(p.name) LIKE ${like} OR lower(b.name) LIKE ${like} OR lower(c.name_ru) LIKE ${like} OR lower(c.name_en) LIKE ${like})`);
    }
  }
  if (q.ids) {
    const ids = q.ids.split(",").filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 60);
    scope.push(ids.length ? sql`p.id IN (${list(ids)})` : sql`false`);
  }
  if (q.tag === "new") scope.push(sql`p.is_new`);
  if (q.tag === "featured") scope.push(sql`p.is_featured`);

  const baseCte = sql`
    WITH base AS (
      SELECT p.id, p.name, p.created_at, p.popularity, b.slug AS brand_slug, b.name AS brand_name,
        (SELECT min(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active) AS price,
        (SELECT bool_or(v.compare_at_price > v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active) AS on_sale,
        (SELECT coalesce(sum(i.quantity - i.reserved), 0) FROM product_variants v JOIN inventory i ON i.variant_id = v.id
          WHERE v.product_id = p.id AND v.is_active) AS stock
      FROM products p
      JOIN brands b ON b.id = p.brand_id
      JOIN categories c ON c.id = p.category_id
      WHERE ${sql.join(scope, sql` AND `)}
    )`;

  const filters: SQL[] = [sql`true`];
  const brandSlugs = q.brand?.split(",").map((x) => x.trim()).filter(Boolean) ?? [];
  if (brandSlugs.length) filters.push(sql`brand_slug IN (${list(brandSlugs)})`);
  if (q.minPrice != null) filters.push(sql`price >= ${q.minPrice}`);
  if (q.maxPrice != null) filters.push(sql`price <= ${q.maxPrice}`);
  if (q.inStock) filters.push(sql`stock > 0`);
  if (q.tag === "deals") filters.push(sql`on_sale`);
  for (const f of parseSpecFilter(q.specs)) {
    filters.push(sql`EXISTS (SELECT 1 FROM product_specs ps WHERE ps.product_id = base.id AND ps.key = ${f.key} AND ps.value IN (${list(f.values)}))`);
  }

  const order = {
    popular: sql`(stock > 0) DESC, popularity DESC, name`,
    price_asc: sql`price ASC NULLS LAST, name`,
    price_desc: sql`price DESC NULLS LAST, name`,
    new: sql`created_at DESC, name`,
    name: sql`name ASC`,
  }[q.sort ?? "popular"];

  const where = sql.join(filters, sql` AND `);
  const [items, totalRows, brandFacet, priceFacet] = await Promise.all([
    rawRows<{ id: string }>(sql`${baseCte} SELECT id FROM base WHERE ${where} ORDER BY ${order} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`),
    rawRows<{ n: number }>(sql`${baseCte} SELECT count(*)::int AS n FROM base WHERE ${where}`),
    rawRows<{ slug: string; name: string; n: number }>(sql`${baseCte} SELECT brand_slug AS slug, brand_name AS name, count(*)::int AS n FROM base GROUP BY 1, 2 ORDER BY 2`),
    rawRows<{ min: string | null; max: string | null }>(sql`${baseCte} SELECT min(price) AS min, max(price) AS max FROM base`),
  ]);

  let specFacets: ProductListResponse["facets"]["specs"] = [];
  if (categorySpecKeys.length) {
    const rows = await rawRows<{ key: string; label_ru: string; label_en: string; value: string; n: number }>(sql`
      ${baseCte}
      SELECT ps.key, min(ps.label_ru) AS label_ru, min(ps.label_en) AS label_en, ps.value, count(DISTINCT ps.product_id)::int AS n
      FROM product_specs ps JOIN base ON base.id = ps.product_id
      WHERE ps.key IN (${list(categorySpecKeys)})
      GROUP BY ps.key, ps.value ORDER BY ps.key, ps.value`);
    specFacets = categorySpecKeys
      .map((key) => {
        const vals = rows.filter((r) => r.key === key);
        return {
          key,
          label: vals[0] ? (lang === "en" ? vals[0].label_en : vals[0].label_ru) : key,
          values: vals.map((v) => ({ value: v.value, count: num(v.n) })),
        };
      })
      .filter((f) => f.values.length > 1);
  }

  const total = num(totalRows[0]?.n);
  return {
    items: await loadCards(items.map((r) => r.id), lang),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    facets: {
      brands: brandFacet.map((b) => ({ slug: b.slug, name: b.name, count: num(b.n) })),
      price: { min: num(priceFacet[0]?.min), max: num(priceFacet[0]?.max) },
      specs: specFacets,
    },
  };
}

export async function getProductDetail(slug: string, lang: Locale): Promise<ProductDetail | null> {
  const p = await db().query.products.findFirst({ where: and(eq(s.products.slug, slug), eq(s.products.isActive, true)) });
  if (!p) return null;
  const [card] = await loadCards([p.id], lang);
  const [imgs, variants, specs] = await Promise.all([
    db().select().from(s.productImages).where(eq(s.productImages.productId, p.id)).orderBy(asc(s.productImages.sortOrder)),
    db()
      .select({ v: s.productVariants, qty: s.inventory.quantity, reserved: s.inventory.reserved })
      .from(s.productVariants)
      .leftJoin(s.inventory, eq(s.inventory.variantId, s.productVariants.id))
      .where(and(eq(s.productVariants.productId, p.id), eq(s.productVariants.isActive, true)))
      .orderBy(asc(s.productVariants.sortOrder)),
    db().select().from(s.productSpecs).where(eq(s.productSpecs.productId, p.id)).orderBy(asc(s.productSpecs.sortOrder)),
  ]);
  const vDtos: Variant[] = variants.map(({ v, qty, reserved }) => ({
    id: v.id,
    sku: v.sku,
    name: v.name,
    options: v.options,
    price: v.price,
    compareAtPrice: v.compareAtPrice && v.compareAtPrice > v.price ? v.compareAtPrice : null,
    currency: v.currency,
    available: Math.max(0, (qty ?? 0) - (reserved ?? 0)),
    isDefault: v.isDefault,
  }));
  const specDtos: Spec[] = specs.map((sp) => ({ key: sp.key, label: lang === "en" ? sp.labelEn : sp.labelRu, value: sp.value }));
  return {
    ...card,
    description: lang === "en" ? p.descriptionEn || p.descriptionRu : p.descriptionRu || p.descriptionEn,
    images: imgs.map((i) => ({ url: i.url, alt: i.alt || p.name })),
    variants: vDtos,
    specs: specDtos,
  };
}

export async function relatedProducts(slug: string, lang: Locale): Promise<ProductCard[]> {
  const rows = await rawRows<{ id: string }>(sql`
    SELECT p2.id FROM products p1
    JOIN products p2 ON p2.category_id = p1.category_id AND p2.id <> p1.id AND p2.is_active
    WHERE p1.slug = ${slug}
    ORDER BY (p2.brand_id = p1.brand_id) DESC, p2.popularity DESC LIMIT 8`);
  return loadCards(rows.map((r) => r.id), lang);
}

export async function homeData(lang: Locale) {
  const [categories, brands, featured, newArrivals, deals] = await Promise.all([
    listCategories(lang),
    listBrands(),
    searchProducts({ tag: "featured", limit: 8, sort: "popular" }, lang),
    searchProducts({ tag: "new", limit: 8, sort: "new" }, lang),
    searchProducts({ tag: "deals", limit: 8, sort: "popular" }, lang),
  ]);
  return { categories, brands, featured: featured.items, newArrivals: newArrivals.items, deals: deals.items };
}
