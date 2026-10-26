import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const productStatusEnum = pgEnum("product_status", ["draft", "published"]);
export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  avatarPath: text("avatar_path"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull().default("customer"),
  },
  (table) => [uniqueIndex("user_roles_user_unique").on(table.userId)],
);

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  recipient: varchar("recipient", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  street: text("street").notNull(),
  notes: text("notes"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  logoPath: text("logo_path"),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id"),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  imagePath: text("image_path"),
});

export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: varchar("locale", { length: 8 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull().default(""),
  },
  (table) => [uniqueIndex("category_translations_unique").on(table.categoryId, table.locale)],
);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  status: productStatusEnum("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productTranslations = pgTable(
  "product_translations",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locale: varchar("locale", { length: 8 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull().default(""),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
  },
  (table) => [uniqueIndex("product_translations_unique").on(table.productId, table.locale)],
);

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 80 }).notNull().unique(),
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
  priceUzs: bigint("price_uzs", { mode: "number" }).notNull(),
  compareAtUzs: bigint("compare_at_uzs", { mode: "number" }),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  labelRu: varchar("label_ru", { length: 120 }).notNull().default("Base"),
  labelEn: varchar("label_en", { length: 120 }).notNull().default("Base"),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  path: text("path").notNull(),
  altRu: text("alt_ru").notNull().default(""),
  altEn: text("alt_en").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productSpecs = pgTable("product_specs", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  labelRu: varchar("label_ru", { length: 120 }).notNull(),
  labelEn: varchar("label_en", { length: 120 }).notNull(),
  valueRu: text("value_ru").notNull(),
  valueEn: text("value_en").notNull(),
});

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("favorites_unique").on(table.userId, table.productId)],
);

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerKey: varchar("owner_key", { length: 120 }).notNull().unique(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [uniqueIndex("cart_items_unique").on(table.cartId, table.variantId)],
);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  guestContact: varchar("guest_contact", { length: 255 }).notNull(),
  number: varchar("number", { length: 40 }).notNull().unique(),
  currency: varchar("currency", { length: 8 }).notNull().default("UZS"),
  subtotalUzs: bigint("subtotal_uzs", { mode: "number" }).notNull(),
  discountUzs: bigint("discount_uzs", { mode: "number" }).notNull().default(0),
  shippingUzs: bigint("shipping_uzs", { mode: "number" }).notNull().default(0),
  totalUzs: bigint("total_uzs", { mode: "number" }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentStatus: varchar("payment_status", { length: 40 }).notNull().default("demo_cod"),
  addressSnapshot: jsonb("address_snapshot").$type<Record<string, string> | null>(),
  idempotencyKey: varchar("idempotency_key", { length: 160 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  skuSnapshot: varchar("sku_snapshot", { length: 80 }).notNull(),
  titleSnapshot: text("title_snapshot").notNull(),
  unitPriceUzs: bigint("unit_price_uzs", { mode: "number" }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalUzs: bigint("line_total_uzs", { mode: "number" }).notNull(),
});

export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  note: text("note").notNull().default(""),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
