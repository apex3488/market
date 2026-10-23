import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { CheckoutInput, ClientKind, Order, OrderStatus } from "@bayhan/shared";
import { ORDER_TRANSITIONS } from "@bayhan/shared";
import { db, schema, type Tx } from "../db/client";
import { env } from "../env";
import { AppError, badRequest, notFound } from "../lib/errors";
import { num, rawRows } from "../lib/sql";
import { cartLines } from "./cart";
import { calculate, findPromotion } from "./pricing";

const s = schema;
type OrderRow = typeof s.orders.$inferSelect;

export const orderNumber = (n: number) => `BM-${String(n).padStart(6, "0")}`;

/** Payment methods offered at checkout. Online providers are not connected yet. */
export function availablePaymentMethods() {
  return [{ id: "cod" as const, testMode: false }];
}

/* ---------------- stock helpers (inside the caller's transaction) ---------------- */

async function orderLines(tx: Tx, orderId: string) {
  return tx
    .select({ variantId: s.orderItems.variantId, quantity: s.orderItems.quantity })
    .from(s.orderItems)
    .where(eq(s.orderItems.orderId, orderId));
}

/** reserved → committed: goods leave the warehouse balance. */
async function commitStock(tx: Tx, order: OrderRow) {
  if (order.stockState !== "reserved") return;
  for (const l of await orderLines(tx, order.id)) {
    if (!l.variantId) continue;
    await tx
      .update(s.inventory)
      .set({
        quantity: sql`${s.inventory.quantity} - ${l.quantity}`,
        reserved: sql`greatest(${s.inventory.reserved} - ${l.quantity}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(s.inventory.variantId, l.variantId));
  }
  await tx.update(s.orders).set({ stockState: "committed" }).where(eq(s.orders.id, order.id));
}

/** Give reserved or committed stock back (on cancellation). */
async function releaseStock(tx: Tx, order: OrderRow) {
  if (order.stockState === "released") return;
  for (const l of await orderLines(tx, order.id)) {
    if (!l.variantId) continue;
    const set =
      order.stockState === "reserved"
        ? { reserved: sql`greatest(${s.inventory.reserved} - ${l.quantity}, 0)` }
        : { quantity: sql`${s.inventory.quantity} + ${l.quantity}` };
    await tx.update(s.inventory).set({ ...set, updatedAt: new Date() }).where(eq(s.inventory.variantId, l.variantId));
  }
  await tx.update(s.orders).set({ stockState: "released" }).where(eq(s.orders.id, order.id));
}

async function setStatus(tx: Tx, orderId: string, status: OrderStatus, note: string | null, actorId: string | null = null) {
  await tx.update(s.orders).set({ status, updatedAt: new Date() }).where(eq(s.orders.id, orderId));
  await tx.insert(s.orderStatusHistory).values({ orderId, status, note, actorId });
}

async function lockOrder(tx: Tx, orderId: string): Promise<OrderRow | undefined> {
  return (await tx.select().from(s.orders).where(eq(s.orders.id, orderId)).for("update").limit(1))[0];
}

/* ---------------- create order ---------------- */

/**
 * Creates an order from the server-side cart. Prices, discount and totals are computed here;
 * stock is reserved atomically; a repeated Idempotency-Key returns the existing order.
 */
export async function createOrder(userId: string, cartId: string | null, input: CheckoutInput, idempotencyKey: string) {
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(idempotencyKey)) throw badRequest("idempotency_key_required", "Idempotency-Key header is required");

  const findExisting = async () =>
    (await db().select({ id: s.orders.id }).from(s.orders)
      .where(and(eq(s.orders.userId, userId), eq(s.orders.idempotencyKey, idempotencyKey))).limit(1))[0];
  const existing = await findExisting();
  if (existing) return { orderId: existing.id, created: false };

  if (!availablePaymentMethods().some((m) => m.id === input.paymentMethod)) {
    throw new AppError(422, "payment_unavailable", "Payment method unavailable");
  }
  if (!cartId) throw new AppError(422, "cart_empty", "Cart is empty");
  const currency = env.STORE_CURRENCY;

  try {
    const orderId = await db().transaction(async (tx) => {
      const lines = await cartLines(tx, cartId);
      if (!lines.length) throw new AppError(422, "cart_empty", "Cart is empty");

      const promo = await findPromotion(tx, input.promoCode);
      if (input.promoCode && !promo) throw new AppError(422, "promo_invalid", "Promo code invalid", { promoCode: "promo_invalid" });
      const quote = calculate(lines, input.deliveryMethod, promo, currency);
      if (quote.promoError) throw new AppError(422, quote.promoError, "Promo code cannot be applied", { promoCode: quote.promoError });
      if (promo) {
        const upd = await tx.update(s.promotions).set({ usedCount: sql`${s.promotions.usedCount} + 1` })
          .where(and(eq(s.promotions.id, promo.id), sql`(${s.promotions.usageLimit} IS NULL OR ${s.promotions.usedCount} < ${s.promotions.usageLimit})`))
          .returning({ id: s.promotions.id });
        if (!upd.length) throw new AppError(422, "promo_invalid", "Promo code exhausted", { promoCode: "promo_invalid" });
      }

      // Atomic reservation: succeeds only if enough free stock remains.
      for (const l of lines) {
        const r = await tx.update(s.inventory)
          .set({ reserved: sql`${s.inventory.reserved} + ${l.quantity}`, updatedAt: new Date() })
          .where(and(eq(s.inventory.variantId, l.variantId), sql`${s.inventory.quantity} - ${s.inventory.reserved} >= ${l.quantity}`))
          .returning({ v: s.inventory.variantId });
        if (!r.length) throw new AppError(409, "out_of_stock", `Not enough stock for ${l.name}`, { [l.variantId]: "out_of_stock" });
      }

      const [order] = await tx.insert(s.orders).values({
        userId,
        status: "confirmed",
        currency,
        subtotal: quote.subtotal,
        discount: quote.discount,
        deliveryFee: quote.deliveryFee,
        total: quote.total,
        promoCode: quote.promoCode,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email ?? null,
        city: input.city,
        address: input.deliveryMethod === "pickup" ? "" : input.address ?? "",
        comment: input.comment ?? "",
        deliveryMethod: input.deliveryMethod,
        paymentMethod: input.paymentMethod,
        client: input.client,
        locale: input.locale ?? "ru",
        idempotencyKey,
      }).returning();

      const specRows = await tx.select().from(s.productSpecs)
        .where(inArray(s.productSpecs.productId, lines.map((l) => l.productId))).orderBy(asc(s.productSpecs.sortOrder));
      const skus = await tx.select({ id: s.productVariants.id, sku: s.productVariants.sku }).from(s.productVariants)
        .where(inArray(s.productVariants.id, lines.map((l) => l.variantId)));

      // Snapshot of name/price/specs at the moment of purchase.
      await tx.insert(s.orderItems).values(lines.map((l) => ({
        orderId: order!.id,
        productId: l.productId,
        variantId: l.variantId,
        slug: l.slug,
        name: l.name,
        variantName: l.variantName,
        sku: skus.find((x) => x.id === l.variantId)?.sku ?? "",
        imageUrl: l.image,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
        specsSnapshot: specRows.filter((sp) => sp.productId === l.productId).slice(0, 6).map((sp) => ({ key: sp.key, value: sp.value })),
      })));
      await tx.insert(s.orderStatusHistory).values({ orderId: order!.id, status: order!.status, note: null });
      await commitStock(tx, order!); // pay-on-delivery: goods are allocated to the order right away

      await tx.update(s.products).set({ popularity: sql`${s.products.popularity} + 1` })
        .where(inArray(s.products.id, lines.map((l) => l.productId)));
      await tx.delete(s.cartItems).where(eq(s.cartItems.cartId, cartId));
      return order!.id;
    });
    return { orderId, created: true };
  } catch (e) {
    // Concurrent retry with the same key: return the order the other request created.
    const msg = `${(e as { code?: string })?.code ?? ""} ${(e as Error)?.message ?? ""}`;
    if (/23505|orders_idem_uq/.test(msg)) {
      const again = await findExisting();
      if (again) return { orderId: again.id, created: false };
    }
    throw e;
  }
}

/* ---------------- status changes ---------------- */

export async function cancelByCustomer(userId: string, orderId: string) {
  await db().transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (!order || order.userId !== userId) throw notFound();
    if (!["pending_payment", "confirmed"].includes(order.status)) throw new AppError(409, "invalid_status", "Order cannot be cancelled");
    await releaseStock(tx, order);
    await setStatus(tx, order.id, "cancelled", "customer");
  });
}

export async function changeStatusByAdmin(actorId: string, orderId: string, status: OrderStatus, note?: string) {
  await db().transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (!order) throw notFound();
    if (!ORDER_TRANSITIONS[order.status as OrderStatus]?.includes(status)) throw new AppError(409, "invalid_status", "Invalid status change");
    if (status === "cancelled") await releaseStock(tx, order);
    await setStatus(tx, orderId, status, note ?? null, actorId);
    await tx.insert(s.auditLogs).values({ actorId, action: "order.status", entity: "order", entityId: orderId, data: { from: order.status, to: status } });
  });
}

/* ---------------- read models ---------------- */

export async function orderDto(orderId: string): Promise<Order | null> {
  const o = (await db().select().from(s.orders).where(eq(s.orders.id, orderId)).limit(1))[0];
  if (!o) return null;
  const [items, hist] = await Promise.all([
    db().select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId)),
    db().select().from(s.orderStatusHistory).where(eq(s.orderStatusHistory.orderId, orderId)).orderBy(asc(s.orderStatusHistory.createdAt)),
  ]);
  return {
    id: o.id,
    number: orderNumber(o.number),
    status: o.status as OrderStatus,
    currency: o.currency,
    subtotal: o.subtotal,
    discount: o.discount,
    deliveryFee: o.deliveryFee,
    total: o.total,
    promoCode: o.promoCode,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email,
    city: o.city,
    address: o.address,
    comment: o.comment,
    deliveryMethod: o.deliveryMethod as Order["deliveryMethod"],
    paymentMethod: o.paymentMethod as Order["paymentMethod"],
    client: o.client as ClientKind,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
    items: items.map((i) => ({
      productId: i.productId, variantId: i.variantId, slug: i.slug, name: i.name, variantName: i.variantName, sku: i.sku,
      image: i.imageUrl, unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal,
    })),
    payments: [],
    history: hist.map((h) => ({ status: h.status as OrderStatus, note: h.note, createdAt: h.createdAt.toISOString() })),
  };
}

export async function listUserOrders(userId: string): Promise<Order[]> {
  const ids = await db().select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.userId, userId)).orderBy(desc(s.orders.createdAt)).limit(100);
  const out: Order[] = [];
  for (const { id } of ids) {
    const o = await orderDto(id);
    if (o) out.push(o);
  }
  return out;
}

export async function adminStats() {
  const [r] = await rawRows<{ revenue: string; orders: number; customers: number; products: number; open: number }>(sql`
    SELECT
      (SELECT coalesce(sum(total), 0) FROM orders WHERE status = 'delivered' OR paid_at IS NOT NULL) AS revenue,
      (SELECT count(*)::int FROM orders) AS orders,
      (SELECT count(*)::int FROM users WHERE role = 'customer') AS customers,
      (SELECT count(*)::int FROM products) AS products,
      (SELECT count(*)::int FROM orders WHERE status IN ('pending_payment','paid','confirmed','processing','shipped')) AS open`);
  const lowStock = await rawRows<{ sku: string; name: string; free: number }>(sql`
    SELECT v.sku, p.name, (i.quantity - i.reserved)::int AS free FROM inventory i
    JOIN product_variants v ON v.id = i.variant_id JOIN products p ON p.id = v.product_id
    WHERE i.quantity - i.reserved <= 3 ORDER BY free, p.name LIMIT 10`);
  return {
    revenue: num(r?.revenue), currency: env.STORE_CURRENCY, orders: num(r?.orders), customers: num(r?.customers),
    products: num(r?.products), openOrders: num(r?.open), lowStock,
  };
}
