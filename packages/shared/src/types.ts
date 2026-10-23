import type { ClientKind, DeliveryMethod, Locale, OrderStatus, PaymentMethod, PaymentStatus } from "./constants";

/** All monetary values are integers in minor units (1/100 of currency). */
export type Money = number;

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  imageUrl: string | null;
  productCount?: number;
  specFilters: string[];
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
}

export interface Variant {
  id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  price: Money;
  compareAtPrice: Money | null;
  currency: string;
  available: number;
  isDefault: boolean;
}

export interface Spec {
  key: string;
  label: string;
  value: string;
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  brand: { slug: string; name: string };
  category: { slug: string; name: string };
  image: string | null;
  price: Money;
  compareAtPrice: Money | null;
  currency: string;
  inStock: boolean;
  isNew: boolean;
  defaultVariantId: string | null;
  keySpecs: Spec[];
  rating: { avg: number; count: number } | null;
}

export interface ProductDetail extends ProductCard {
  description: string;
  images: { url: string; alt: string }[];
  variants: Variant[];
  specs: Spec[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface FacetValue {
  value: string;
  count: number;
}
export interface ProductListResponse extends Paginated<ProductCard> {
  facets: {
    brands: { slug: string; name: string; count: number }[];
    price: { min: number; max: number };
    specs: { key: string; label: string; values: FacetValue[] }[];
  };
}

export interface HomeResponse {
  categories: Category[];
  featured: ProductCard[];
  newArrivals: ProductCard[];
  deals: ProductCard[];
  brands: Brand[];
}

export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  image: string | null;
  unitPrice: Money;
  compareAtPrice: Money | null;
  quantity: number;
  lineTotal: Money;
  available: number;
}

export interface Cart {
  items: CartLine[];
  count: number;
  subtotal: Money;
  currency: string;
  cartToken?: string;
}

export interface Quote {
  subtotal: Money;
  discount: Money;
  deliveryFee: Money;
  total: Money;
  currency: string;
  promoCode: string | null;
  promoError?: string;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "customer" | "admin";
  locale: Locale;
  telegramLinked: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface OrderItem {
  productId: string | null;
  variantId: string | null;
  slug: string | null;
  name: string;
  variantName: string;
  sku: string;
  image: string | null;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
}

export interface PaymentSummary {
  id: string;
  provider: PaymentMethod;
  status: PaymentStatus;
  amount: Money;
  currency: string;
  confirmationUrl: string | null;
  createdAt: string;
  succeededAt: string | null;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  currency: string;
  subtotal: Money;
  discount: Money;
  deliveryFee: Money;
  total: Money;
  promoCode: string | null;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  comment: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  client: ClientKind;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
  payments: PaymentSummary[];
  history: { status: OrderStatus; note: string | null; createdAt: string }[];
}

export interface CreateOrderResponse {
  order: Order;
  payment: { required: boolean; confirmationUrl: string | null; error?: string };
}

export interface PublicConfig {
  currency: string;
  locales: Locale[];
  delivery: { method: DeliveryMethod; fee: Money }[];
  paymentMethods: { id: PaymentMethod; testMode: boolean }[];
  telegramBotUsername: string | null;
}

export interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  createdAt: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}
