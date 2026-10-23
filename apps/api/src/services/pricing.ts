import { eq } from "drizzle-orm";
import type { DeliveryMethod, Quote } from "@bayhan/shared";
import { schema } from "../db/client";
import type { Db, Tx } from "../db/client";
import { env } from "../env";

export type PromotionRow = typeof schema.promotions.$inferSelect;

export function deliveryFee(method: DeliveryMethod): number {
  return method === "courier" ? env.DELIVERY_COURIER_FEE : 0;
}

/** Returns an error code if the promotion cannot be applied. */
export function promoError(p: PromotionRow | undefined, subtotal: number, now = new Date()): string | null {
  if (!p || !p.isActive) return "promo_invalid";
  if (p.startsAt && p.startsAt > now) return "promo_invalid";
  if (p.endsAt && p.endsAt < now) return "promo_invalid";
  if (p.usageLimit != null && p.usedCount >= p.usageLimit) return "promo_invalid";
  if (subtotal < p.minSubtotal) return "promo_min";
  return null;
}

export function discountFor(p: PromotionRow, subtotal: number): number {
  const raw = p.kind === "percent" ? Math.floor((subtotal * Math.min(p.value, 90)) / 100) : p.value;
  // round discount down to whole currency units to avoid fractional prices
  return Math.min(subtotal, Math.floor(raw / 100) * 100);
}

/** Pure price calculation — everything the client sends besides ids/quantities is ignored. */
export function calculate(
  lines: { unitPrice: number; quantity: number }[],
  delivery: DeliveryMethod,
  promo: PromotionRow | undefined,
  currency: string,
): Quote {
  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0);
  const err = promo ? promoError(promo, subtotal) : null;
  const discount = promo && !err ? discountFor(promo, subtotal) : 0;
  const fee = lines.length ? deliveryFee(delivery) : 0;
  return {
    subtotal,
    discount,
    deliveryFee: fee,
    total: Math.max(0, subtotal - discount + fee),
    currency,
    promoCode: promo && !err ? promo.code : null,
    ...(err ? { promoError: err } : {}),
  };
}

export async function findPromotion(dbx: Db | Tx, code: string | undefined) {
  if (!code) return undefined;
  const rows = await dbx.select().from(schema.promotions).where(eq(schema.promotions.code, code.toUpperCase())).limit(1);
  return rows[0];
}
