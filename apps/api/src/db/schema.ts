import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => bigint(name, { mode: "number" });

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email"),
    phone: text("phone"),
    passwordHash: text("password_hash"),
    name: text("name").notNull(),
    role: text("role", { enum: ["customer", "admin"] }).notNull().default("customer"),
    locale: text("locale", { enum: ["ru", "en"] }).notNull().default("ru"),
    telegramId: bigint("telegram_id", { mode: "number" }),
    telegramUsername: text("telegram_username"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_phone_uq").on(t.phone),
    uniqueIndex("users_telegram_uq").on(t.telegramId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    client: text("client").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

export const passwordResets = pgTable(
  "password_resets",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("password_resets_token_uq").on(t.tokenHash)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull().default(""),
    recipient: text("recipient").notNull(),
    phone: text("phone").notNull(),
    city: text("city").notNull(),
    addressLine: text("address_line").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

export const categories = pgTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  nameRu: text("name_ru").notNull(),
  nameEn: text("name_en").notNull(),
  icon: text("icon").notNull().default("box"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  specFilters: jsonb("spec_filters").$type<string[]>().notNull().default([]),
  createdAt: createdAt(),
});

export const brands = pgTable("brands", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  createdAt: createdAt(),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
    brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    descriptionRu: text("description_ru").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    isNew: boolean("is_new").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    popularity: integer("popularity").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_brand_idx").on(t.brandId),
    index("products_active_idx").on(t.isActive),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: id(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: id(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull().default(""),
    options: jsonb("options").$type<Record<string, string>>().notNull().default({}),
    price: money("price").notNull(),
    compareAtPrice: money("compare_at_price"),
    currency: text("currency").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("variants_product_idx").on(t.productId),
    index("variants_price_idx").on(t.price),
    check("variants_price_ck", sql`${t.price} >= 0`),
  ],
);

export const productSpecs = pgTable(
  "product_specs",
  {
    id: id(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    labelRu: text("label_ru").notNull(),
    labelEn: text("label_en").notNull(),
    value: text("value").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("specs_product_idx").on(t.productId), index("specs_key_value_idx").on(t.key, t.value)],
);

export const inventory = pgTable(
  "inventory",
  {
    variantId: uuid("variant_id").primaryKey().references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("inventory_qty_ck", sql`${t.quantity} >= 0`),
    check("inventory_reserved_ck", sql`${t.reserved} >= 0 AND ${t.reserved} <= ${t.quantity}`),
  ],
);

export const carts = pgTable(
  "carts",
  {
    id: id(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("carts_user_uq").on(t.userId), uniqueIndex("carts_token_uq").on(t.tokenHash)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: id(),
    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("cart_items_uq").on(t.cartId, t.variantId), check("cart_items_qty_ck", sql`${t.quantity} > 0`)],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const promotions = pgTable("promotions", {
  id: id(),
  code: text("code").notNull().unique(),
  kind: text("kind", { enum: ["percent", "fixed"] }).notNull(),
  value: integer("value").notNull(), // percent or minor units
  minSubtotal: money("min_subtotal").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
});

export const orders = pgTable(
  "orders",
  {
    id: id(),
    number: serial("number").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    status: text("status").notNull(),
    currency: text("currency").notNull(),
    subtotal: money("subtotal").notNull(),
    discount: money("discount").notNull().default(0),
    deliveryFee: money("delivery_fee").notNull().default(0),
    total: money("total").notNull(),
    promoCode: text("promo_code"),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    city: text("city").notNull(),
    address: text("address").notNull().default(""),
    comment: text("comment").notNull().default(""),
    deliveryMethod: text("delivery_method").notNull(),
    paymentMethod: text("payment_method").notNull(),
    client: text("client").notNull(),
    locale: text("locale").notNull().default("ru"),
    idempotencyKey: text("idempotency_key").notNull(),
    stockState: text("stock_state", { enum: ["reserved", "committed", "released"] }).notNull().default("reserved"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_idem_uq").on(t.userId, t.idempotencyKey),
    uniqueIndex("orders_number_uq").on(t.number),
    index("orders_user_idx").on(t.userId, t.createdAt),
    index("orders_status_idx").on(t.status),
    check("orders_total_ck", sql`${t.total} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    slug: text("slug"),
    name: text("name").notNull(),
    variantName: text("variant_name").notNull().default(""),
    sku: text("sku").notNull(),
    imageUrl: text("image_url"),
    unitPrice: money("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: money("line_total").notNull(),
    specsSnapshot: jsonb("specs_snapshot").$type<{ key: string; value: string }[]>().notNull().default([]),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: id(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    note: text("note"),
    actorId: uuid("actor_id"),
    createdAt: createdAt(),
  },
  (t) => [index("osh_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
    provider: text("provider").notNull(),
    externalId: text("external_id"),
    amount: money("amount").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull().default("pending"),
    providerStatus: text("provider_status"),
    idempotencyKey: text("idempotency_key").notNull(),
    confirmationUrl: text("confirmation_url"),
    lastEventId: text("last_event_id"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    succeededAt: timestamp("succeeded_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("payments_idem_uq").on(t.idempotencyKey),
    uniqueIndex("payments_external_uq").on(t.provider, t.externalId),
    index("payments_order_idx").on(t.orderId),
  ],
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: id(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    type: text("type").notNull(),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("payment_events_uq").on(t.provider, t.eventId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    text: text("text").notNull(),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("reviews_user_product_uq").on(t.productId, t.userId),
    check("reviews_rating_ck", sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    platform: text("platform").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("push_tokens_user_idx").on(t.userId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    data: jsonb("data"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);
