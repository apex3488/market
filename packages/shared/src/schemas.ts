import { z } from "zod";
import { CART_MAX_QTY, CLIENTS, DELIVERY_METHODS, LOCALES, ORDER_STATUSES, PAYMENT_METHODS, SORTS } from "./constants";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{9,15}$/, "phone_invalid"));

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "name_short").max(80),
    email: z.email("email_invalid").trim().toLowerCase().optional().or(z.literal("").transform(() => undefined)),
    phone: phone.optional().or(z.literal("").transform(() => undefined)),
    password: z.string().min(8, "password_short").max(128),
    locale: z.enum(LOCALES).optional(),
    cartToken: z.string().max(200).optional(),
  })
  .refine((v) => v.email || v.phone, { message: "email_or_phone_required", path: ["email"] });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(1).max(128),
  cartToken: z.string().max(200).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotSchema = z.object({ identifier: z.string().trim().min(3).max(120), locale: z.enum(LOCALES).optional() });
export const resetSchema = z.object({ token: z.string().min(20).max(200), password: z.string().min(8, "password_short").max(128) });

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  locale: z.enum(LOCALES).optional(),
});

export const telegramAuthSchema = z.object({ initData: z.string().min(10).max(4096), cartToken: z.string().max(200).optional() });

export const cartItemSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(CART_MAX_QTY),
});
export const cartQtySchema = z.object({ quantity: z.number().int().min(1).max(CART_MAX_QTY) });

export const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(60).optional(),
  brand: z.string().max(400).optional(), // comma separated slugs
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: z.enum(["1", "true"]).optional(),
  sort: z.enum(SORTS).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  specs: z.string().max(1000).optional(), // "key:v1|v2;key2:v3"
  ids: z.string().max(1000).optional(),
  tag: z.enum(["new", "featured", "deals"]).optional(),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "name_short").max(80),
  phone,
  email: z.email("email_invalid").optional().or(z.literal("").transform(() => undefined)),
  city: z.string().trim().min(2, "city_required").max(80),
  address: z.string().trim().max(240).optional().default(""),
  comment: z.string().trim().max(500).optional().default(""),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  paymentMethod: z.enum(PAYMENT_METHODS),
  promoCode: z.string().trim().toUpperCase().max(40).optional().or(z.literal("").transform(() => undefined)),
  client: z.enum(CLIENTS).default("web"),
  locale: z.enum(LOCALES).optional(),
}).refine((v) => v.deliveryMethod === "pickup" || (v.address && v.address.length >= 5), {
  message: "address_required",
  path: ["address"],
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const quoteSchema = z.object({
  deliveryMethod: z.enum(DELIVERY_METHODS),
  promoCode: z.string().trim().toUpperCase().max(40).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10).max(2000),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default(""),
  recipient: z.string().trim().min(2).max(80),
  phone,
  city: z.string().trim().min(2).max(80),
  addressLine: z.string().trim().min(5).max(240),
  isDefault: z.boolean().optional().default(false),
});

export const pushTokenSchema = z.object({
  token: z.string().min(10).max(300),
  platform: z.enum(["ios", "android", "web"]),
});

/* ---------- admin ---------- */

export const adminVariantSchema = z.object({
  id: z.uuid().optional(),
  sku: z.string().trim().min(2).max(60),
  name: z.string().trim().max(120).default(""),
  options: z.record(z.string(), z.string()).default({}),
  price: z.number().int().min(0), // minor units
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).max(1_000_000),
  isDefault: z.boolean().default(false),
});

export const adminProductSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{2,120}$/, "slug_invalid"),
  name: z.string().trim().min(2).max(200),
  categoryId: z.uuid(),
  brandId: z.uuid(),
  descriptionRu: z.string().max(5000).default(""),
  descriptionEn: z.string().max(5000).default(""),
  isActive: z.boolean().default(true),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  images: z.array(z.object({ url: z.url().max(1000), alt: z.string().max(200).default("") })).max(12).default([]),
  specs: z
    .array(z.object({ key: z.string().min(1).max(60), labelRu: z.string().max(80), labelEn: z.string().max(80), value: z.string().max(200) }))
    .max(60)
    .default([]),
  variants: z.array(adminVariantSchema).min(1).max(30),
});
export type AdminProductInput = z.infer<typeof adminProductSchema>;

export const adminCategorySchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/),
  nameRu: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  icon: z.string().max(40).default("box"),
  imageUrl: z.url().max(1000).nullable().optional(),
  sortOrder: z.number().int().default(0),
  specFilters: z.array(z.string().max(60)).max(10).default([]),
});

export const adminBrandSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/),
  name: z.string().trim().min(1).max(80),
  logoUrl: z.url().max(1000).nullable().optional(),
});

export const adminPromotionSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/),
  kind: z.enum(["percent", "fixed"]),
  value: z.number().int().min(1),
  minSubtotal: z.number().int().min(0).default(0),
  startsAt: z.iso.datetime().nullable().optional(),
  endsAt: z.iso.datetime().nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().default(true),
}).refine((v) => v.kind !== "percent" || v.value <= 90, { message: "percent_max_90", path: ["value"] });

export const adminOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(500).optional(),
});

export const adminCustomerSchema = z.object({ role: z.enum(["customer", "admin"]) });
