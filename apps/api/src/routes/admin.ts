import { Hono } from "hono";
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import {
  adminBrandSchema,
  adminCategorySchema,
  adminCustomerSchema,
  adminOrderStatusSchema,
  adminProductSchema,
  adminPromotionSchema,
  type AdminProductInput,
} from "@bayhan/shared";
import { db, schema, type Tx } from "../db/client";
import { env } from "../env";
import { requireAdmin, type AppEnv } from "../lib/auth";
import { AppError, jsonBody, notFound, parse } from "../lib/errors";
import { adminStats, changeStatusByAdmin, orderDto, orderNumber } from "../services/orders";

const s = schema;
export const adminRoutes = new Hono<AppEnv>();

// Every admin route requires an authenticated admin — checked on the server.
adminRoutes.use("*", async (c, next) => {
  requireAdmin(c);
  await next();
});

const uuidRe = /^[0-9a-f-]{36}$/i;
const idParam = (v: string) => {
  if (!uuidRe.test(v)) throw notFound();
  return v;
};
const like = (q: string) => `%${q.replace(/[%_\\]/g, "\\$&")}%`;

async function audit(actorId: string, action: string, entity: string, entityId: string | null, data?: unknown) {
  await db().insert(s.auditLogs).values({ actorId, action, entity, entityId, data: (data ?? null) as Record<string, unknown> | null });
}

function uniqueViolation(e: unknown): never {
  const msg = `${(e as { code?: string })?.code ?? ""} ${(e as Error)?.message ?? ""}`;
  if (/23505|unique/i.test(msg)) throw new AppError(409, "duplicate", "Slug, SKU or code already exists");
  if (/23503|foreign key/i.test(msg)) throw new AppError(409, "in_use", "Entity is referenced by other records");
  if (/23514|check constraint/i.test(msg)) throw new AppError(409, "stock_below_reserved", "Stock cannot be lower than reserved quantity");
  throw e;
}

adminRoutes.get("/stats", async (c) => {
  const stats = await adminStats();
  const recent = await db().select({ id: s.orders.id }).from(s.orders).orderBy(desc(s.orders.createdAt)).limit(8);
  const orders = [];
  for (const r of recent) orders.push(await orderDto(r.id));
  return c.json({ ...stats, recentOrders: orders });
});

/* ---------------- products ---------------- */

adminRoutes.get("/products", async (c) => {
  const q = c.req.query("q")?.trim();
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const where: SQL | undefined = q ? or(ilike(s.products.name, like(q)), ilike(s.products.slug, like(q))) : undefined;
  const rows = await db()
    .select({
      id: s.products.id, slug: s.products.slug, name: s.products.name, isActive: s.products.isActive,
      category: s.categories.nameRu, brand: s.brands.name,
      price: sql<number>`(SELECT min(price) FROM product_variants v WHERE v.product_id = ${s.products.id} AND v.is_active)`.mapWith(Number),
      stock: sql<number>`(SELECT coalesce(sum(i.quantity - i.reserved),0) FROM product_variants v JOIN inventory i ON i.variant_id = v.id WHERE v.product_id = ${s.products.id} AND v.is_active)`.mapWith(Number),
      image: sql<string | null>`(SELECT url FROM product_images pi WHERE pi.product_id = ${s.products.id} ORDER BY sort_order LIMIT 1)`,
    })
    .from(s.products)
    .innerJoin(s.categories, eq(s.categories.id, s.products.categoryId))
    .innerJoin(s.brands, eq(s.brands.id, s.products.brandId))
    .where(where)
    .orderBy(desc(s.products.updatedAt))
    .limit(50)
    .offset((page - 1) * 50);
  const total = await db().select({ n: sql<number>`count(*)`.mapWith(Number) }).from(s.products).where(where);
  return c.json({ items: rows, total: total[0]?.n ?? 0, page, currency: env.STORE_CURRENCY });
});

adminRoutes.get("/products/:id", async (c) => {
  const id = idParam(c.req.param("id"));
  const p = (await db().select().from(s.products).where(eq(s.products.id, id)).limit(1))[0];
  if (!p) throw notFound();
  const [images, specs, variants] = await Promise.all([
    db().select().from(s.productImages).where(eq(s.productImages.productId, id)).orderBy(asc(s.productImages.sortOrder)),
    db().select().from(s.productSpecs).where(eq(s.productSpecs.productId, id)).orderBy(asc(s.productSpecs.sortOrder)),
    db().select({ v: s.productVariants, qty: s.inventory.quantity, reserved: s.inventory.reserved })
      .from(s.productVariants).leftJoin(s.inventory, eq(s.inventory.variantId, s.productVariants.id))
      .where(and(eq(s.productVariants.productId, id), eq(s.productVariants.isActive, true))).orderBy(asc(s.productVariants.sortOrder)),
  ]);
  return c.json({
    ...p,
    images: images.map((i) => ({ url: i.url, alt: i.alt })),
    specs: specs.map((x) => ({ key: x.key, labelRu: x.labelRu, labelEn: x.labelEn, value: x.value })),
    variants: variants.map(({ v, qty, reserved }) => ({
      id: v.id, sku: v.sku, name: v.name, options: v.options, price: v.price, compareAtPrice: v.compareAtPrice,
      stock: qty ?? 0, reserved: reserved ?? 0, isDefault: v.isDefault,
    })),
  });
});

async function writeProductChildren(tx: Tx, productId: string, input: AdminProductInput) {
  await tx.delete(s.productImages).where(eq(s.productImages.productId, productId));
  if (input.images.length)
    await tx.insert(s.productImages).values(input.images.map((im, i) => ({ productId, url: im.url, alt: im.alt, sortOrder: i })));
  await tx.delete(s.productSpecs).where(eq(s.productSpecs.productId, productId));
  if (input.specs.length)
    await tx.insert(s.productSpecs).values(input.specs.map((sp, i) => ({ productId, ...sp, sortOrder: i })));

  const existing = await tx.select({ id: s.productVariants.id }).from(s.productVariants).where(eq(s.productVariants.productId, productId));
  const keep = new Set<string>();
  const hasDefault = input.variants.some((v) => v.isDefault);
  for (const [i, v] of input.variants.entries()) {
    const values = {
      productId, sku: v.sku, name: v.name, options: v.options, price: v.price,
      compareAtPrice: v.compareAtPrice && v.compareAtPrice > v.price ? v.compareAtPrice : null,
      currency: env.STORE_CURRENCY, isDefault: hasDefault ? v.isDefault : i === 0, isActive: true, sortOrder: i,
    };
    let variantId: string;
    if (v.id && existing.some((e) => e.id === v.id)) {
      await tx.update(s.productVariants).set(values).where(eq(s.productVariants.id, v.id));
      variantId = v.id;
    } else {
      variantId = (await tx.insert(s.productVariants).values(values).returning({ id: s.productVariants.id }))[0]!.id;
    }
    keep.add(variantId);
    await tx.insert(s.inventory).values({ variantId, quantity: v.stock })
      .onConflictDoUpdate({ target: s.inventory.variantId, set: { quantity: v.stock, updatedAt: new Date() } });
  }
  const removed = existing.map((e) => e.id).filter((id) => !keep.has(id));
  // Deactivate instead of delete so historical order items stay intact.
  if (removed.length) await tx.update(s.productVariants).set({ isActive: false }).where(inArray(s.productVariants.id, removed));
}

adminRoutes.post("/products", async (c) => {
  const admin = requireAdmin(c);
  const input = parse(adminProductSchema, await jsonBody(c));
  try {
    const id = await db().transaction(async (tx) => {
      const [p] = await tx.insert(s.products).values({
        slug: input.slug, name: input.name, categoryId: input.categoryId, brandId: input.brandId,
        descriptionRu: input.descriptionRu, descriptionEn: input.descriptionEn,
        isActive: input.isActive, isNew: input.isNew, isFeatured: input.isFeatured,
      }).returning({ id: s.products.id });
      await writeProductChildren(tx, p!.id, input);
      return p!.id;
    });
    await audit(admin.id, "product.create", "product", id, { slug: input.slug });
    return c.json({ id }, 201);
  } catch (e) {
    uniqueViolation(e);
  }
});

adminRoutes.put("/products/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  const input = parse(adminProductSchema, await jsonBody(c));
  try {
    await db().transaction(async (tx) => {
      const r = await tx.update(s.products).set({
        slug: input.slug, name: input.name, categoryId: input.categoryId, brandId: input.brandId,
        descriptionRu: input.descriptionRu, descriptionEn: input.descriptionEn,
        isActive: input.isActive, isNew: input.isNew, isFeatured: input.isFeatured, updatedAt: new Date(),
      }).where(eq(s.products.id, id)).returning({ id: s.products.id });
      if (!r.length) throw notFound();
      await writeProductChildren(tx, id, input);
    });
  } catch (e) {
    if (e instanceof AppError) throw e;
    uniqueViolation(e);
  }
  await audit(admin.id, "product.update", "product", id, { slug: input.slug });
  return c.json({ id });
});

adminRoutes.delete("/products/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  await db().update(s.products).set({ isActive: false, updatedAt: new Date() }).where(eq(s.products.id, id));
  await audit(admin.id, "product.archive", "product", id);
  return c.json({ ok: true });
});

/* ---------------- categories / brands / promotions ---------------- */

adminRoutes.get("/categories", async (c) => c.json(await db().select().from(s.categories).orderBy(asc(s.categories.sortOrder))));
adminRoutes.post("/categories", async (c) => {
  const admin = requireAdmin(c);
  const input = parse(adminCategorySchema, await jsonBody(c));
  try {
    const [r] = await db().insert(s.categories).values(input).returning();
    await audit(admin.id, "category.create", "category", r!.id, input);
    return c.json(r, 201);
  } catch (e) { uniqueViolation(e); }
});
adminRoutes.put("/categories/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  const input = parse(adminCategorySchema, await jsonBody(c));
  try {
    const [r] = await db().update(s.categories).set(input).where(eq(s.categories.id, id)).returning();
    if (!r) throw notFound();
    await audit(admin.id, "category.update", "category", id, input);
    return c.json(r);
  } catch (e) { if (e instanceof AppError) throw e; uniqueViolation(e); }
});
adminRoutes.delete("/categories/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  try { await db().delete(s.categories).where(eq(s.categories.id, id)); } catch (e) { uniqueViolation(e); }
  await audit(admin.id, "category.delete", "category", id);
  return c.json({ ok: true });
});

adminRoutes.get("/brands", async (c) => c.json(await db().select().from(s.brands).orderBy(asc(s.brands.name))));
adminRoutes.post("/brands", async (c) => {
  const admin = requireAdmin(c);
  const input = parse(adminBrandSchema, await jsonBody(c));
  try {
    const [r] = await db().insert(s.brands).values(input).returning();
    await audit(admin.id, "brand.create", "brand", r!.id, input);
    return c.json(r, 201);
  } catch (e) { uniqueViolation(e); }
});
adminRoutes.put("/brands/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  const input = parse(adminBrandSchema, await jsonBody(c));
  try {
    const [r] = await db().update(s.brands).set(input).where(eq(s.brands.id, id)).returning();
    if (!r) throw notFound();
    await audit(admin.id, "brand.update", "brand", id, input);
    return c.json(r);
  } catch (e) { if (e instanceof AppError) throw e; uniqueViolation(e); }
});
adminRoutes.delete("/brands/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  try { await db().delete(s.brands).where(eq(s.brands.id, id)); } catch (e) { uniqueViolation(e); }
  await audit(admin.id, "brand.delete", "brand", id);
  return c.json({ ok: true });
});

const promoValues = (i: ReturnType<typeof adminPromotionSchema.parse>) => ({
  ...i,
  startsAt: i.startsAt ? new Date(i.startsAt) : null,
  endsAt: i.endsAt ? new Date(i.endsAt) : null,
  usageLimit: i.usageLimit ?? null,
});
adminRoutes.get("/promotions", async (c) => c.json(await db().select().from(s.promotions).orderBy(desc(s.promotions.createdAt))));
adminRoutes.post("/promotions", async (c) => {
  const admin = requireAdmin(c);
  const input = parse(adminPromotionSchema, await jsonBody(c));
  try {
    const [r] = await db().insert(s.promotions).values(promoValues(input)).returning();
    await audit(admin.id, "promotion.create", "promotion", r!.id, input);
    return c.json(r, 201);
  } catch (e) { uniqueViolation(e); }
});
adminRoutes.put("/promotions/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  const input = parse(adminPromotionSchema, await jsonBody(c));
  try {
    const [r] = await db().update(s.promotions).set(promoValues(input)).where(eq(s.promotions.id, id)).returning();
    if (!r) throw notFound();
    await audit(admin.id, "promotion.update", "promotion", id, input);
    return c.json(r);
  } catch (e) { if (e instanceof AppError) throw e; uniqueViolation(e); }
});
adminRoutes.delete("/promotions/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  await db().delete(s.promotions).where(eq(s.promotions.id, id));
  await audit(admin.id, "promotion.delete", "promotion", id);
  return c.json({ ok: true });
});

/* ---------------- orders ---------------- */

adminRoutes.get("/orders", async (c) => {
  const q = c.req.query("q")?.trim();
  const status = c.req.query("status");
  const conds: SQL[] = [];
  if (status) conds.push(eq(s.orders.status, status));
  if (q) {
    const n = Number(q.replace(/^BM-0*/i, ""));
    const textMatch = or(ilike(s.orders.customerName, like(q)), ilike(s.orders.phone, like(q)), ilike(s.orders.city, like(q)))!;
    conds.push(Number.isInteger(n) && n > 0 ? or(eq(s.orders.number, n), textMatch)! : textMatch);
  }
  const rows = await db().select().from(s.orders).where(conds.length ? and(...conds) : undefined).orderBy(desc(s.orders.createdAt)).limit(100);
  return c.json(rows.map((o) => ({
    id: o.id, number: orderNumber(o.number), status: o.status, total: o.total, currency: o.currency,
    customerName: o.customerName, phone: o.phone, city: o.city, paymentMethod: o.paymentMethod,
    deliveryMethod: o.deliveryMethod, client: o.client, createdAt: o.createdAt.toISOString(),
  })));
});

adminRoutes.get("/orders/:id", async (c) => {
  const o = await orderDto(idParam(c.req.param("id")));
  if (!o) throw notFound();
  return c.json(o);
});

adminRoutes.patch("/orders/:id/status", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  const input = parse(adminOrderStatusSchema, await jsonBody(c));
  await changeStatusByAdmin(admin.id, id, input.status, input.note);
  return c.json(await orderDto(id));
});

/* ---------------- customers ---------------- */

adminRoutes.get("/customers", async (c) => {
  const q = c.req.query("q")?.trim();
  const rows = await db()
    .select({
      id: s.users.id, name: s.users.name, email: s.users.email, phone: s.users.phone, role: s.users.role,
      createdAt: s.users.createdAt,
      orders: sql<number>`(SELECT count(*) FROM orders o WHERE o.user_id = ${s.users.id})`.mapWith(Number),
    })
    .from(s.users)
    .where(q ? or(ilike(s.users.name, like(q)), ilike(s.users.email, like(q)), ilike(s.users.phone, like(q))) : undefined)
    .orderBy(desc(s.users.createdAt))
    .limit(100);
  return c.json(rows);
});

adminRoutes.patch("/customers/:id", async (c) => {
  const admin = requireAdmin(c);
  const id = idParam(c.req.param("id"));
  if (id === admin.id) throw new AppError(409, "self_role", "You cannot change your own role");
  const input = parse(adminCustomerSchema, await jsonBody(c));
  const [r] = await db().update(s.users).set({ role: input.role, updatedAt: new Date() }).where(eq(s.users.id, id)).returning({ id: s.users.id });
  if (!r) throw notFound();
  await db().delete(s.sessions).where(eq(s.sessions.userId, id)); // force re-login with new rights
  await audit(admin.id, "customer.role", "user", id, input);
  return c.json({ ok: true });
});

adminRoutes.get("/audit", async (c) =>
  c.json(await db().select().from(s.auditLogs).orderBy(desc(s.auditLogs.createdAt)).limit(100)),
);
