import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { cartItemSchema, cartQtySchema, checkoutSchema, productQuerySchema, quoteSchema, reviewSchema, LOCALES, type PublicConfig } from "@bayhan/shared";
import { db, schema } from "../db/client";
import { env } from "../env";
import { requireUser, type AppEnv } from "../lib/auth";
import { jsonBody, notFound, parse } from "../lib/errors";
import { rateLimit } from "../lib/rate-limit";
import { addItem, cartDto, cartLines, removeItem, resolveCartId, setQty } from "../services/cart";
import { getProductDetail, homeData, listBrands, listCategories, loadCards, relatedProducts, searchProducts } from "../services/catalog";
import { availablePaymentMethods, cancelByCustomer, createOrder, listUserOrders, orderDto } from "../services/orders";
import { calculate, deliveryFee, findPromotion } from "../services/pricing";

const s = schema;
export const storeRoutes = new Hono<AppEnv>();

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const assertUuid = (v: string) => {
  if (!uuidRe.test(v)) throw notFound();
  return v;
};

/* ---------------- catalog ---------------- */

storeRoutes.get("/config", (c) => {
  const body: PublicConfig = {
    currency: env.STORE_CURRENCY,
    locales: [...LOCALES],
    delivery: [
      { method: "courier", fee: deliveryFee("courier") },
      { method: "pickup", fee: deliveryFee("pickup") },
    ],
    paymentMethods: availablePaymentMethods(),
    telegramBotUsername: null,
  };
  return c.json(body);
});

storeRoutes.get("/home", async (c) => c.json(await homeData(c.get("lang"))));
storeRoutes.get("/categories", async (c) => c.json(await listCategories(c.get("lang"))));
storeRoutes.get("/brands", async (c) => c.json(await listBrands()));

storeRoutes.get("/products", async (c) => {
  const q = parse(productQuerySchema, c.req.query());
  return c.json(await searchProducts(q, c.get("lang")));
});

storeRoutes.get("/search/suggest", async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return c.json([]);
  const r = await searchProducts({ q, limit: 6 }, c.get("lang"));
  return c.json(r.items);
});

storeRoutes.get("/products/:slug", async (c) => {
  const p = await getProductDetail(c.req.param("slug"), c.get("lang"));
  if (!p) throw notFound();
  return c.json(p);
});

storeRoutes.get("/products/:slug/related", async (c) => c.json(await relatedProducts(c.req.param("slug"), c.get("lang"))));

storeRoutes.get("/products/:slug/reviews", async (c) => {
  const rows = await db()
    .select({ id: s.reviews.id, rating: s.reviews.rating, text: s.reviews.text, author: s.users.name, createdAt: s.reviews.createdAt })
    .from(s.reviews)
    .innerJoin(s.products, eq(s.products.id, s.reviews.productId))
    .innerJoin(s.users, eq(s.users.id, s.reviews.userId))
    .where(and(eq(s.products.slug, c.req.param("slug")), eq(s.reviews.isPublished, true)))
    .orderBy(desc(s.reviews.createdAt))
    .limit(50);
  return c.json(rows.map((r) => ({ ...r, author: r.author.split(" ")[0], createdAt: r.createdAt.toISOString() })));
});

storeRoutes.post("/products/:slug/reviews", rateLimit({ windowMs: 60 * 60_000, max: 10, key: "review" }), async (c) => {
  const user = requireUser(c);
  const input = parse(reviewSchema, await jsonBody(c));
  const p = (await db().select({ id: s.products.id }).from(s.products).where(eq(s.products.slug, c.req.param("slug"))).limit(1))[0];
  if (!p) throw notFound();
  const [r] = await db()
    .insert(s.reviews)
    .values({ productId: p.id, userId: user.id, rating: input.rating, text: input.text })
    .onConflictDoUpdate({ target: [s.reviews.productId, s.reviews.userId], set: { rating: input.rating, text: input.text, createdAt: new Date() } })
    .returning();
  return c.json({ id: r!.id, rating: r!.rating, text: r!.text, author: user.name.split(" ")[0], createdAt: r!.createdAt.toISOString() }, 201);
});

/* ---------------- cart (user cart or guest cart via X-Cart-Token) ---------------- */

storeRoutes.get("/cart", async (c) => c.json(await cartDto(await resolveCartId(c, false))));

storeRoutes.post("/cart/items", async (c) => {
  const input = parse(cartItemSchema, await jsonBody(c));
  const v = (await db().select({ id: s.productVariants.id }).from(s.productVariants)
    .innerJoin(s.products, eq(s.products.id, s.productVariants.productId))
    .where(and(eq(s.productVariants.id, input.variantId), eq(s.productVariants.isActive, true), eq(s.products.isActive, true))).limit(1))[0];
  if (!v) throw notFound();
  const cartId = (await resolveCartId(c, true))!;
  await addItem(cartId, input.variantId, input.quantity);
  return c.json(await cartDto(cartId));
});

storeRoutes.patch("/cart/items/:variantId", async (c) => {
  const variantId = assertUuid(c.req.param("variantId"));
  const { quantity } = parse(cartQtySchema, await jsonBody(c));
  const cartId = await resolveCartId(c, false);
  if (cartId) await setQty(cartId, variantId, quantity);
  return c.json(await cartDto(cartId));
});

storeRoutes.delete("/cart/items/:variantId", async (c) => {
  const variantId = assertUuid(c.req.param("variantId"));
  const cartId = await resolveCartId(c, false);
  if (cartId) await removeItem(cartId, variantId);
  return c.json(await cartDto(cartId));
});

storeRoutes.delete("/cart", async (c) => {
  const cartId = await resolveCartId(c, false);
  if (cartId) await db().delete(s.cartItems).where(eq(s.cartItems.cartId, cartId));
  return c.json(await cartDto(cartId));
});

/* ---------------- favorites ---------------- */

storeRoutes.get("/favorites", async (c) => {
  const user = requireUser(c);
  const rows = await db().select({ id: s.favorites.productId }).from(s.favorites).where(eq(s.favorites.userId, user.id)).orderBy(desc(s.favorites.createdAt));
  return c.json(await loadCards(rows.map((r) => r.id), c.get("lang")));
});

storeRoutes.get("/favorites/ids", async (c) => {
  const user = c.get("user");
  if (!user) return c.json([]);
  const rows = await db().select({ id: s.favorites.productId }).from(s.favorites).where(eq(s.favorites.userId, user.id));
  return c.json(rows.map((r) => r.id));
});

storeRoutes.put("/favorites/:productId", async (c) => {
  const user = requireUser(c);
  const productId = assertUuid(c.req.param("productId"));
  const exists = await db().select({ id: s.products.id }).from(s.products).where(eq(s.products.id, productId)).limit(1);
  if (!exists.length) throw notFound();
  await db().insert(s.favorites).values({ userId: user.id, productId }).onConflictDoNothing();
  return c.json({ ok: true });
});

storeRoutes.delete("/favorites/:productId", async (c) => {
  const user = requireUser(c);
  const productId = assertUuid(c.req.param("productId"));
  await db().delete(s.favorites).where(and(eq(s.favorites.userId, user.id), eq(s.favorites.productId, productId)));
  return c.json({ ok: true });
});

/* ---------------- checkout & orders ---------------- */

storeRoutes.post("/checkout/quote", async (c) => {
  const input = parse(quoteSchema, await jsonBody(c));
  const cartId = await resolveCartId(c, false);
  const lines = cartId ? await cartLines(db(), cartId) : [];
  const promo = await findPromotion(db(), input.promoCode);
  const quote = calculate(lines, input.deliveryMethod, promo, env.STORE_CURRENCY);
  if (input.promoCode && !promo) quote.promoError = "promo_invalid";
  return c.json(quote);
});

storeRoutes.post("/orders", rateLimit({ windowMs: 10 * 60_000, max: 20, key: "orders" }), async (c) => {
  const user = requireUser(c);
  const input = parse(checkoutSchema, await jsonBody(c));
  const cartId = await resolveCartId(c, false);
  const { orderId, created } = await createOrder(user.id, cartId, input, c.req.header("idempotency-key") ?? "");
  const order = await orderDto(orderId);
  return c.json({ order, payment: { required: false, confirmationUrl: null } }, created ? 201 : 200);
});

storeRoutes.get("/orders", async (c) => c.json(await listUserOrders(requireUser(c).id)));

storeRoutes.get("/orders/:id", async (c) => {
  const user = requireUser(c);
  const id = assertUuid(c.req.param("id"));
  const order = await orderDto(id);
  const owner = await db().select({ userId: s.orders.userId }).from(s.orders).where(eq(s.orders.id, id)).limit(1);
  if (!order || (owner[0]?.userId !== user.id && user.role !== "admin")) throw notFound();
  return c.json(order);
});

storeRoutes.post("/orders/:id/cancel", async (c) => {
  const user = requireUser(c);
  const id = assertUuid(c.req.param("id"));
  await cancelByCustomer(user.id, id);
  return c.json(await orderDto(id));
});

/* ---------------- addresses ---------------- */

storeRoutes.get("/addresses", async (c) => {
  const user = requireUser(c);
  return c.json(await db().select().from(s.addresses).where(eq(s.addresses.userId, user.id)).orderBy(desc(s.addresses.isDefault)));
});

storeRoutes.delete("/addresses/:id", async (c) => {
  const user = requireUser(c);
  await db().delete(s.addresses).where(and(eq(s.addresses.id, assertUuid(c.req.param("id"))), eq(s.addresses.userId, user.id)));
  return c.json({ ok: true });
});

