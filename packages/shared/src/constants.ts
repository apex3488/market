export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

export const BRAND = {
  name: "BAYHAN MARKET",
  sloganRu: "Технологии для жизни. Выбор без компромиссов.",
  sloganEn: "Technology for life. No compromises.",
} as const;

export const COLORS = {
  bg: "#07090D",
  bg2: "#0D1118",
  card: "#111722",
  blue: "#287BFF",
  glow: "#58A6FF",
  text: "#F5F7FA",
  muted: "#929BAC",
  border: "rgba(255,255,255,0.08)",
  success: "#2ECC8F",
  danger: "#FF5A6E",
  warning: "#FFB547",
} as const;

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed manual transitions (admin). Payment-driven transitions happen on the server only. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  paid: ["processing", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export const PAYMENT_STATUSES = ["pending", "processing", "succeeded", "failed", "canceled", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["cod", "stripe", "yookassa", "mock"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DELIVERY_METHODS = ["courier", "pickup"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const CLIENTS = ["web", "telegram", "mobile"] as const;
export type ClientKind = (typeof CLIENTS)[number];

export const SORTS = ["popular", "price_asc", "price_desc", "new", "name"] as const;
export type SortKey = (typeof SORTS)[number];

export const CART_MAX_QTY = 10;
export const COMPARE_MAX = 4;
export const PAGE_SIZE = 24;
