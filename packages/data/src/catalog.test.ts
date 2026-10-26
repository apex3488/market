import { describe, expect, it, beforeEach } from "vitest";
import {
  adminRepository,
  cartRepository,
  catalogRepository,
  orderRepository,
  resetMocks,
  userRepository,
} from "./index";

beforeEach(() => {
  resetMocks();
});

const baseQuery = { sort: "new" as const, includeDrafts: false, page: 1, pageSize: 48 };

describe("catalog mock", () => {
  it("hides drafts from guests and keeps them for admin", async () => {
    const publicList = await catalogRepository.listProducts("ru", baseQuery);
    const adminList = await catalogRepository.listProducts("ru", { ...baseQuery, includeDrafts: true });
    expect(publicList.length).toBeGreaterThanOrEqual(30);
    expect(publicList.length).toBeLessThanOrEqual(50);
    expect(publicList.some((item) => item.slug === "arca-band")).toBe(false);
    expect(adminList.some((item) => item.slug === "arca-band")).toBe(true);
    expect(await catalogRepository.getBySlug("ru", "arca-band")).toBeNull();
    expect(await catalogRepository.getBySlug("ru", "arca-band", true)).not.toBeNull();
  });

  it("pages catalog results", async () => {
    const page = await catalogRepository.listProductsPage("ru", {
      category: "telefony",
      sort: "price_asc",
      includeDrafts: false,
      page: 1,
      pageSize: 3,
    });
    expect(page.items).toHaveLength(3);
    expect(page.total).toBeGreaterThan(3);
    expect(page.pageCount).toBeGreaterThan(1);
  });

  it("uses the catalog price, not a client price", async () => {
    const cart = await cartRepository.add("guest-1", "nordline-s9-128", 2);
    expect(cart.items[0]?.unitPriceUzs).toBe(12_490_000);
    expect(cart.totalUzs).toBe(24_980_000);
  });

  it("refuses an order when stock is short and keeps another user's orders apart", async () => {
    await cartRepository.add("guest-1", "lumenwerk-glass-base", 1);
    await expect(
      orderRepository.create({ ownerKey: "guest-1", userId: "user-customer", contact: "a@velin.demo" }),
    ).rejects.toThrow("OUT_OF_STOCK");

    await cartRepository.add("guest-2", "nordline-kettle-base", 1);
    const order = await orderRepository.create({
      ownerKey: "guest-2",
      userId: "user-customer",
      contact: "buyer@velin.demo",
    });
    expect(order.items[0]?.unitPriceUzs).toBe(490_000);
    expect(await orderRepository.listByUser("user-admin")).toEqual([]);
    expect((await orderRepository.listByUser("user-customer")).map((entry) => entry.id)).toEqual([order.id]);
    expect(await orderRepository.getForUser("user-admin", order.id)).toBeNull();
    expect(await orderRepository.getForUser("user-customer", order.id)).not.toBeNull();
  });

  it("keeps profile updates and favorites on the owner account", async () => {
    const buyer = await userRepository.findAuthByEmail("buyer@velin.demo");
    const admin = await userRepository.findAuthByEmail("admin@velin.demo");
    expect(buyer).not.toBeNull();
    expect(admin).not.toBeNull();
    await userRepository.updateProfile(buyer!.id, { displayName: "Азира Demo" });
    expect((await userRepository.findById(admin!.id))?.displayName).toBe("Админ");
    await userRepository.toggleFavorite(buyer!.id, "nordline-s9");
    expect(await userRepository.listFavorites(admin!.id)).toEqual([]);
    expect(await userRepository.listFavorites(buyer!.id)).toEqual(["nordline-s9"]);
  });

  it("merges guest cart into the user cart after login", async () => {
    await cartRepository.add("guest-merge", "nordline-s9-128", 1);
    await cartRepository.add("user-customer", "nordline-kettle-base", 1);
    const merged = await cartRepository.merge("guest-merge", "user-customer");
    expect(merged.items).toHaveLength(2);
    expect((await cartRepository.get("guest-merge")).items).toHaveLength(0);
  });

  it("reprices from catalog and returns the same order for a repeated idempotency key", async () => {
    await cartRepository.add("guest-price", "nordline-s9-128", 1);
    const first = await orderRepository.create({
      ownerKey: "guest-price",
      userId: "user-customer",
      contact: "buyer@velin.demo",
      idempotencyKey: "idem-1",
    });
    expect(first.items[0]?.unitPriceUzs).toBe(12_490_000);
    await cartRepository.add("guest-price", "nordline-s9-128", 1);
    const second = await orderRepository.create({
      ownerKey: "guest-price",
      userId: "user-customer",
      contact: "buyer@velin.demo",
      idempotencyKey: "idem-1",
    });
    expect(second.id).toBe(first.id);
  });

  it("lets admin change order status and blocks invalid transitions", async () => {
    await cartRepository.add("guest-admin-order", "nordline-kettle-base", 1);
    const order = await orderRepository.create({
      ownerKey: "guest-admin-order",
      userId: "user-customer",
      contact: "buyer@velin.demo",
    });
    const confirmed = await orderRepository.updateStatus(order.id, "confirmed", "ok");
    expect(confirmed.status).toBe("confirmed");
    await expect(orderRepository.updateStatus(order.id, "pending")).rejects.toThrow("INVALID_STATUS");
    await adminRepository.setProductStatus("arca-band", "published");
    expect(await catalogRepository.getBySlug("ru", "arca-band")).not.toBeNull();
  });
});
