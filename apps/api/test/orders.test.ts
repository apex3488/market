import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, setDbHandle, schema as s, type Db } from "../src/db/client";
import { hashPassword, verifyPassword } from "../src/lib/crypto";
import { calculate, discountFor, promoError, type PromotionRow } from "../src/services/pricing";
import { addItem } from "../src/services/cart";
import { cancelByCustomer, changeStatusByAdmin, createOrder, orderDto } from "../src/services/orders";

let db: Db;
let close: () => Promise<void>;
let userId: string;
let variantId: string;

const checkout = {
  customerName: "Test", phone: "+998901234567", city: "Tashkent", address: "Amir Temur 1", comment: "",
  deliveryMethod: "courier" as const, paymentMethod: "cod" as const, client: "web" as const,
};

async function freshCart(qty: number) {
  const [c] = await db.insert(s.carts).values({}).returning();
  await addItem(c!.id, variantId, qty);
  return c!.id;
}
const stock = async () => (await db.select().from(s.inventory).where(eq(s.inventory.variantId, variantId)))[0]!;

beforeAll(async () => {
  const h = await createDb("pglite:memory");
  await h.migrate();
  setDbHandle(h);
  db = h.db;
  close = h.close;
  const [cat] = await db.insert(s.categories).values({ slug: "phones", nameRu: "Телефоны", nameEn: "Phones" }).returning();
  const [brand] = await db.insert(s.brands).values({ slug: "acme", name: "Acme" }).returning();
  const [p] = await db.insert(s.products).values({ slug: "acme-x", name: "Acme X", categoryId: cat!.id, brandId: brand!.id }).returning();
  const [v] = await db.insert(s.productVariants).values({ productId: p!.id, sku: "ACME-X-1", price: 1_000_000_00, currency: "UZS", isDefault: true }).returning();
  variantId = v!.id;
  await db.insert(s.inventory).values({ variantId, quantity: 5 });
  const [u] = await db.insert(s.users).values({ name: "Buyer", email: "b@test.local" }).returning();
  userId = u!.id;
  await db.insert(s.promotions).values({ code: "TEN", kind: "percent", value: 10, minSubtotal: 0, usageLimit: 1 });
});

afterAll(async () => close?.());

describe("pricing", () => {
  const promo = (p: Partial<PromotionRow>): PromotionRow => ({
    id: "x", code: "P", kind: "percent", value: 10, minSubtotal: 0, startsAt: null, endsAt: null,
    usageLimit: null, usedCount: 0, isActive: true, createdAt: new Date(), ...p,
  });

  it("computes totals on the server from unit prices", () => {
    const q = calculate([{ unitPrice: 100_00, quantity: 3 }], "pickup", undefined, "UZS");
    expect(q).toMatchObject({ subtotal: 300_00, discount: 0, deliveryFee: 0, total: 300_00 });
  });

  it("applies courier fee and percent promo", () => {
    const q = calculate([{ unitPrice: 1_000_000_00, quantity: 1 }], "courier", promo({}), "UZS");
    expect(q.discount).toBe(100_000_00);
    expect(q.total).toBe(1_000_000_00 - 100_000_00 + q.deliveryFee);
  });

  it("rejects expired, inactive, exhausted and below-minimum promos", () => {
    expect(promoError(promo({ endsAt: new Date(Date.now() - 1000) }), 1)).toBe("promo_invalid");
    expect(promoError(promo({ isActive: false }), 1)).toBe("promo_invalid");
    expect(promoError(promo({ usageLimit: 1, usedCount: 1 }), 1)).toBe("promo_invalid");
    expect(promoError(promo({ minSubtotal: 500 }), 100)).toBe("promo_min");
  });

  it("never discounts more than the subtotal", () => {
    expect(discountFor(promo({ kind: "fixed", value: 999_999_00 }), 100_00)).toBe(100_00);
  });
});

describe("passwords", () => {
  it("hashes with scrypt and verifies", async () => {
    const h = await hashPassword("correct horse");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
});

describe("orders", () => {
  it("creates an order with server prices, snapshot and committed stock", async () => {
    const cartId = await freshCart(2);
    const { orderId, created } = await createOrder(userId, cartId, { ...checkout, promoCode: "TEN" }, "key-order-0001");
    expect(created).toBe(true);
    const o = (await orderDto(orderId))!;
    expect(o.status).toBe("confirmed");
    expect(o.subtotal).toBe(2_000_000_00);
    expect(o.discount).toBe(200_000_00);
    expect(o.items[0]).toMatchObject({ name: "Acme X", sku: "ACME-X-1", unitPrice: 1_000_000_00, quantity: 2 });
    expect(await stock()).toMatchObject({ quantity: 3, reserved: 0 });
    const items = await db.select().from(s.cartItems).where(eq(s.cartItems.cartId, cartId));
    expect(items).toHaveLength(0);
  });

  it("returns the same order for a repeated idempotency key", async () => {
    const cartId = await freshCart(1);
    const again = await createOrder(userId, cartId, checkout, "key-order-0001");
    expect(again.created).toBe(false);
    expect(await stock()).toMatchObject({ quantity: 3 });
  });

  it("does not apply an exhausted promo code", async () => {
    const cartId = await freshCart(1);
    await expect(createOrder(userId, cartId, { ...checkout, promoCode: "TEN" }, "key-order-0002")).rejects.toMatchObject({ code: "promo_invalid" });
  });

  it("refuses to oversell and leaves stock untouched", async () => {
    const cartId = await freshCart(4);
    await expect(createOrder(userId, cartId, checkout, "key-order-0003")).rejects.toMatchObject({ code: "out_of_stock" });
    expect(await stock()).toMatchObject({ quantity: 3, reserved: 0 });
  });

  it("restocks on cancellation and blocks invalid admin transitions", async () => {
    const cartId = await freshCart(1);
    const { orderId } = await createOrder(userId, cartId, checkout, "key-order-0004");
    expect(await stock()).toMatchObject({ quantity: 2 });
    await expect(changeStatusByAdmin(userId, orderId, "delivered")).rejects.toMatchObject({ code: "invalid_status" });
    await cancelByCustomer(userId, orderId);
    expect(await stock()).toMatchObject({ quantity: 3 });
    expect((await orderDto(orderId))!.status).toBe("cancelled");
    await expect(cancelByCustomer(userId, orderId)).rejects.toMatchObject({ code: "invalid_status" });
  });

  it("only lets the owner cancel", async () => {
    const cartId = await freshCart(1);
    const { orderId } = await createOrder(userId, cartId, checkout, "key-order-0005");
    const [other] = await db.insert(s.users).values({ name: "Other", email: "o@test.local" }).returning();
    await expect(cancelByCustomer(other!.id, orderId)).rejects.toMatchObject({ code: "not_found" });
  });
});
