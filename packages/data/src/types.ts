import type { Locale, ProductStatus } from "@market/contracts";

export type Copy = Record<Locale, string>;

export type Category = {
  id: string;
  parentId: string | null;
  slug: string;
  sortOrder: number;
  image: string;
  translations: Record<Locale, { name: string; description: string }>;
};

export type Brand = {
  id: string;
  slug: string;
  name: string;
};

export type Variant = {
  id: string;
  sku: string;
  priceUzs: number;
  stockQuantity: number;
  label: Copy;
};

export type Product = {
  id: string;
  brandId: string;
  categoryId: string;
  slug: string;
  status: ProductStatus;
  featured: boolean;
  image: string;
  translations: Record<Locale, { title: string; description: string }>;
  variants: Variant[];
  specs: { label: Copy; value: Copy }[];
};

export type Promo = {
  id: string;
  href: string;
  image: string;
  problem: Copy;
  agitate: Copy;
  solution: Copy;
  cta: Copy;
};

export type Address = {
  id: string;
  recipient: string;
  phone: string;
  city: string;
  street: string;
  isDefault: boolean;
};

export type CategoryView = {
  id: string;
  slug: string;
  parentSlug: string | null;
  name: string;
  description: string;
  image: string;
  children: { slug: string; name: string }[];
};

export type ProductCard = {
  slug: string;
  title: string;
  brandName: string;
  categorySlug: string;
  priceUzs: number;
  stockQuantity: number;
  image: string;
  featured: boolean;
  status: ProductStatus;
};

export type ProductDetail = ProductCard & {
  description: string;
  specs: { label: string; value: string }[];
  variants: {
    id: string;
    sku: string;
    label: string;
    priceUzs: number;
    stockQuantity: number;
  }[];
};

export type CartItem = {
  variantId: string;
  sku: string;
  title: string;
  unitPriceUzs: number;
  quantity: number;
  lineTotalUzs: number;
};

export type Cart = {
  ownerKey: string;
  items: CartItem[];
  totalUzs: number;
};

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type OrderAddress = {
  recipient: string;
  phone: string;
  city: string;
  street: string;
};

export type OrderEvent = {
  at: string;
  status: OrderStatus;
  note: string;
};

export type Order = {
  id: string;
  number: string;
  userId: string | null;
  contact: string;
  status: OrderStatus;
  paymentMethod: "cod_demo";
  totalUzs: number;
  address: OrderAddress | null;
  items: CartItem[];
  events: OrderEvent[];
  idempotencyKey: string | null;
};

export type DemoUser = {
  id: string;
  email: string;
  displayName: string;
  role: "customer" | "admin";
};

export type AuthUser = DemoUser & {
  password: string;
  phone: string;
  avatarPath: string | null;
  emailVerified: boolean;
};
