import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Runs the Neon repositories against PGlite, a real Postgres in WebAssembly, through the same tagged-template API.
const pg = new PGlite();

vi.mock("@neondatabase/serverless", () => ({
  neon: () => async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.reduce((acc, part, index) => acc + part + (index < values.length ? `$${index + 1}` : ""), "");
    const result = await pg.query(text, values);
    return result.rows;
  },
}));

process.env.DATABASE_URL = "postgres://pglite";
const { cartRepository, orderRepository, userRepository } = await import("./neon");
const { catalogRepository } = await import("./mock");

let variantId = "";

beforeAll(async () => {
  const products = await catalogRepository.listProducts("ru", {
    sort: "new",
    includeDrafts: false,
    page: 1,
    pageSize: 48,
  });
  const inStock = products.find((item) => item.stockQuantity > 2)!;
  const detail = await catalogRepository.getBySlug("ru", inStock.slug);
  variantId = detail!.variants.find((variant) => variant.stockQuantity > 2)!.id;
});

describe("neon repositories", () => {
  it("seeds the demo buyer with a hashed password", async () => {
    const buyer = await userRepository.findAuthByEmail("buyer@velin.demo");
    expect(buyer).not.toBeNull();
    expect(buyer!.password).toMatch(/^scrypt\$/);
    expect(await userRepository.checkPassword(buyer!, "demo1234")).toBe(true);
    expect(await userRepository.checkPassword(buyer!, "wrong")).toBe(false);
    expect(userRepository.supportsDemoReset).toBe(false);
  });

  it("registers users, rejects duplicates and updates the profile", async () => {
    const user = await userRepository.register({ email: "New@Example.com", password: "secret12", displayName: "" });
    expect(user.email).toBe("new@example.com");
    expect(user.displayName).toBe("new");
    await expect(
      userRepository.register({ email: "new@example.com", password: "other123", displayName: "x" }),
    ).rejects.toThrow("EMAIL_TAKEN");
    const updated = await userRepository.updateProfile(user.id, { displayName: "Нова", password: "changed1" });
    expect(updated.displayName).toBe("Нова");
    expect(await userRepository.checkPassword(updated, "changed1")).toBe(true);
    expect(await userRepository.checkPassword(updated, "secret12")).toBe(false);
  });

  it("links Google to an existing email and drops its password", async () => {
    await userRepository.register({ email: "claim@example.com", password: "attacker1", displayName: "a" });
    const linked = await userRepository.upsertOAuthUser({
      id: "google-123",
      email: "claim@example.com",
      displayName: "Owner",
      avatarPath: "https://example.com/a.png",
    });
    expect(linked.emailVerified).toBe(true);
    expect(await userRepository.checkPassword(linked, "attacker1")).toBe(false);
    const again = await userRepository.upsertOAuthUser({
      id: "google-123",
      email: "claim@example.com",
      displayName: "Owner",
      avatarPath: null,
    });
    expect(again.id).toBe(linked.id);
    const fresh = await userRepository.upsertOAuthUser({
      id: "google-456",
      email: "fresh@example.com",
      displayName: "Fresh",
      avatarPath: null,
    });
    expect(fresh.id).toBe("google-456");
    expect(fresh.role).toBe("customer");
  });

  it("grants admin from ADMIN_EMAILS only to Google-linked accounts", async () => {
    process.env.ADMIN_EMAILS = "boss@example.com, pass@example.com";
    await userRepository.register({ email: "pass@example.com", password: "secret12", displayName: "p" });
    expect((await userRepository.findAuthByEmail("pass@example.com"))!.role).toBe("customer");
    const boss = await userRepository.upsertOAuthUser({
      id: "google-boss",
      email: "boss@example.com",
      displayName: "Boss",
      avatarPath: null,
    });
    expect(boss.role).toBe("admin");
    delete process.env.ADMIN_EMAILS;
  });

  it("keeps addresses and favorites", async () => {
    const user = await userRepository.register({ email: "addr@example.com", password: "secret12", displayName: "a" });
    const base = { recipient: "A", phone: "1", city: "Ташкент", street: "Улица 1" };
    await userRepository.addAddress(user.id, { ...base, isDefault: true });
    const list = await userRepository.addAddress(user.id, { ...base, street: "Улица 2", isDefault: true });
    expect(list).toHaveLength(2);
    expect(list.filter((item) => item.isDefault).map((item) => item.street)).toEqual(["Улица 2"]);
    expect(await userRepository.toggleFavorite(user.id, "slug-a")).toEqual(["slug-a"]);
    expect(await userRepository.toggleFavorite(user.id, "slug-b")).toEqual(["slug-a", "slug-b"]);
    expect(await userRepository.toggleFavorite(user.id, "slug-a")).toEqual(["slug-b"]);
  });

  it("merges a guest cart, creates an order once and moves it through statuses", async () => {
    const user = await userRepository.register({ email: "order@example.com", password: "secret12", displayName: "o" });
    await cartRepository.add("guest-1", variantId, 1);
    await cartRepository.add("guest-1", variantId, 1);
    await cartRepository.add(user.id, variantId, 1);
    const merged = await cartRepository.merge("guest-1", user.id);
    expect(merged.items).toHaveLength(1);
    expect(merged.items[0]!.quantity).toBe(3);
    expect((await cartRepository.get("guest-1")).items).toHaveLength(0);
    await cartRepository.setQuantity(user.id, variantId, 2);

    const input = { ownerKey: user.id, userId: user.id, contact: user.email, idempotencyKey: "key-1" };
    const order = await orderRepository.create(input);
    expect(order.number).toMatch(/^VL-\d+$/);
    expect(order.items[0]!.quantity).toBe(2);
    expect(order.totalUzs).toBe(order.items[0]!.lineTotalUzs);
    expect((await cartRepository.get(user.id)).items).toHaveLength(0);
    expect((await orderRepository.create(input)).id).toBe(order.id);

    expect(await orderRepository.listByUser(user.id)).toHaveLength(1);
    expect(await orderRepository.getForUser("someone-else", order.id)).toBeNull();
    const confirmed = await orderRepository.updateStatus(order.id, "confirmed", "ok");
    expect(confirmed.events.map((event) => event.status)).toEqual(["pending", "confirmed"]);
    await expect(orderRepository.updateStatus(order.id, "pending")).rejects.toThrow("INVALID_STATUS");
    await expect(orderRepository.create({ ...input, idempotencyKey: "key-2" })).rejects.toThrow("EMPTY_CART");
  });
});
