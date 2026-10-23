import type { Context } from "hono";
import { and, eq, sql } from "drizzle-orm";
import type { Cart, CartLine } from "@bayhan/shared";
import { CART_MAX_QTY } from "@bayhan/shared";
import { db, schema } from "../db/client";
import type { Db, Tx } from "../db/client";
import type { AppEnv } from "../lib/auth";
import { randomToken, sha256 } from "../lib/crypto";
import { rawRows, num } from "../lib/sql";
import { env } from "../env";

const s = schema;

/** Resolve the cart for the current user, or a guest cart identified by the X-Cart-Token header. */
export async function resolveCartId(c: Context<AppEnv>, create: boolean): Promise<string | null> {
  const user = c.get("user");
  if (user) {
    const found = await db().select({ id: s.carts.id }).from(s.carts).where(eq(s.carts.userId, user.id)).limit(1);
    if (found[0]) return found[0].id;
    if (!create) return null;
    const ins = await db().insert(s.carts).values({ userId: user.id }).onConflictDoNothing().returning({ id: s.carts.id });
    if (ins[0]) return ins[0].id;
    const again = await db().select({ id: s.carts.id }).from(s.carts).where(eq(s.carts.userId, user.id)).limit(1);
    return again[0]!.id;
  }
  const token = c.req.header("x-cart-token");
  if (token && token.length <= 200) {
    const found = await db().select({ id: s.carts.id }).from(s.carts).where(eq(s.carts.tokenHash, sha256(token))).limit(1);
    if (found[0]) return found[0].id;
  }
  if (!create) return null;
  const newToken = randomToken(24);
  const ins = await db().insert(s.carts).values({ tokenHash: sha256(newToken) }).returning({ id: s.carts.id });
  c.header("X-Cart-Token", newToken);
  return ins[0]!.id;
}

export async function cartLines(dbx: Db | Tx, cartId: string): Promise<CartLine[]> {
  const rows = await rawRows<{
    variant_id: string; product_id: string; slug: string; name: string; variant_name: string; image: string | null;
    price: string; compare_at_price: string | null; quantity: number; available: number; active: boolean;
  }>(sql`
    SELECT ci.variant_id, p.id AS product_id, p.slug, p.name, v.name AS variant_name,
      (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order LIMIT 1) AS image,
      v.price, v.compare_at_price, ci.quantity,
      coalesce(i.quantity - i.reserved, 0)::int AS available,
      (p.is_active AND v.is_active) AS active
    FROM cart_items ci
    JOIN product_variants v ON v.id = ci.variant_id
    JOIN products p ON p.id = v.product_id
    LEFT JOIN inventory i ON i.variant_id = v.id
    WHERE ci.cart_id = ${cartId}
    ORDER BY ci.created_at`, dbx);
  return rows
    .filter((r) => r.active)
    .map((r) => {
      const unitPrice = num(r.price);
      const cmp = r.compare_at_price ? num(r.compare_at_price) : null;
      return {
        variantId: r.variant_id,
        productId: r.product_id,
        slug: r.slug,
        name: r.name,
        variantName: r.variant_name,
        image: r.image,
        unitPrice,
        compareAtPrice: cmp && cmp > unitPrice ? cmp : null,
        quantity: r.quantity,
        lineTotal: unitPrice * r.quantity,
        available: num(r.available),
      };
    });
}

export async function cartDto(cartId: string | null): Promise<Cart> {
  const items = cartId ? await cartLines(db(), cartId) : [];
  return {
    items,
    count: items.reduce((a, l) => a + l.quantity, 0),
    subtotal: items.reduce((a, l) => a + l.lineTotal, 0),
    currency: env.STORE_CURRENCY,
  };
}

export async function addItem(cartId: string, variantId: string, quantity: number) {
  await db()
    .insert(s.cartItems)
    .values({ cartId, variantId, quantity })
    .onConflictDoUpdate({
      target: [s.cartItems.cartId, s.cartItems.variantId],
      set: { quantity: sql`least(${s.cartItems.quantity} + ${quantity}, ${CART_MAX_QTY})` },
    });
  await db().update(s.carts).set({ updatedAt: new Date() }).where(eq(s.carts.id, cartId));
}

export async function setQty(cartId: string, variantId: string, quantity: number) {
  await db()
    .update(s.cartItems)
    .set({ quantity })
    .where(and(eq(s.cartItems.cartId, cartId), eq(s.cartItems.variantId, variantId)));
}

export async function removeItem(cartId: string, variantId: string) {
  await db().delete(s.cartItems).where(and(eq(s.cartItems.cartId, cartId), eq(s.cartItems.variantId, variantId)));
}

/** Move a guest cart into the user's cart after sign-in. */
export async function mergeGuestCart(guestToken: string | undefined, userId: string) {
  if (!guestToken) return;
  const guest = await db().select({ id: s.carts.id }).from(s.carts).where(eq(s.carts.tokenHash, sha256(guestToken))).limit(1);
  if (!guest[0]) return;
  await db().transaction(async (tx) => {
    let userCart = (await tx.select({ id: s.carts.id }).from(s.carts).where(eq(s.carts.userId, userId)).limit(1))[0];
    if (!userCart) userCart = (await tx.insert(s.carts).values({ userId }).returning({ id: s.carts.id }))[0]!;
    const items = await tx.select().from(s.cartItems).where(eq(s.cartItems.cartId, guest[0]!.id));
    for (const it of items) {
      await tx
        .insert(s.cartItems)
        .values({ cartId: userCart.id, variantId: it.variantId, quantity: it.quantity })
        .onConflictDoUpdate({
          target: [s.cartItems.cartId, s.cartItems.variantId],
          set: { quantity: sql`least(${s.cartItems.quantity} + ${it.quantity}, ${CART_MAX_QTY})` },
        });
    }
    await tx.delete(s.carts).where(eq(s.carts.id, guest[0]!.id));
  });
}
