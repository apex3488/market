import type { Locale, ProductQuery } from "@market/contracts";
import type {
  Address,
  AuthUser,
  Brand,
  Cart,
  CategoryView,
  DemoUser,
  Order,
  ProductCard,
  ProductDetail,
} from "./types";

export type {
  Address,
  AuthUser,
  Brand,
  Cart,
  CartItem,
  CategoryView,
  DemoUser,
  Order,
  OrderAddress,
  OrderEvent,
  OrderStatus,
  ProductCard,
  ProductDetail,
} from "./types";

export type PromoView = {
  id: string;
  href: string;
  image: string;
  problem: string;
  agitate: string;
  solution: string;
  cta: string;
};

export type ProductPage = {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ProfileView = {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  avatarPath: string | null;
  role: "customer" | "admin";
  emailVerified: boolean;
};

export interface CatalogRepository {
  listCategories(locale: Locale): Promise<CategoryView[]>;
  getCategory(locale: Locale, slug: string): Promise<CategoryView | null>;
  listBrands(): Promise<Brand[]>;
  listProducts(locale: Locale, query: ProductQuery): Promise<ProductCard[]>;
  listProductsPage(locale: Locale, query: ProductQuery): Promise<ProductPage>;
  getBySlug(locale: Locale, slug: string, includeDrafts?: boolean): Promise<ProductDetail | null>;
  getBySlugs(locale: Locale, slugs: string[]): Promise<ProductDetail[]>;
  suggest(locale: Locale, q: string): Promise<{ slug: string; title: string }[]>;
  listPromos(locale: Locale): Promise<PromoView[]>;
}

export interface CartRepository {
  get(ownerKey: string): Promise<Cart>;
  add(ownerKey: string, variantId: string, quantity: number): Promise<Cart>;
  setQuantity(ownerKey: string, variantId: string, quantity: number): Promise<Cart>;
  remove(ownerKey: string, variantId: string): Promise<Cart>;
  merge(fromKey: string, toKey: string): Promise<Cart>;
}

export type CreateOrderInput = {
  ownerKey: string;
  userId: string | null;
  contact: string;
  address?: {
    recipient: string;
    phone: string;
    city: string;
    street: string;
  };
  paymentMethod?: "cod_demo";
  idempotencyKey?: string;
};

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  listByUser(userId: string): Promise<Order[]>;
  getForUser(userId: string, orderId: string): Promise<Order | null>;
  listAll(): Promise<Order[]>;
  getById(orderId: string): Promise<Order | null>;
  updateStatus(orderId: string, status: Order["status"], note?: string): Promise<Order>;
}

export type AdminProductInput = {
  slug: string;
  brandId: string;
  categoryId: string;
  titleRu: string;
  titleEn: string;
  descriptionRu: string;
  descriptionEn: string;
  priceUzs: number;
  stockQuantity: number;
  status: "draft" | "published";
  featured: boolean;
  image: string;
};

export interface AdminRepository {
  listProducts(): Promise<ProductDetail[]>;
  setProductStatus(slug: string, status: "draft" | "published"): Promise<void>;
  setVariantStock(variantId: string, stockQuantity: number): Promise<void>;
  upsertProduct(input: AdminProductInput): Promise<ProductDetail>;
  listPromos(locale: Locale): Promise<PromoView[]>;
  updatePromo(id: string, patch: Partial<PromoView> & { id: string }): Promise<void>;
}

export interface UserRepository {
  findByEmail(email: string): Promise<DemoUser | null>;
  findAuthByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  list(): Promise<DemoUser[]>;
  register(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<AuthUser>;
  /** False when the store keeps real accounts: resetting by email alone would let anyone take one over. */
  supportsDemoReset: boolean;
  checkPassword(user: AuthUser, password: string): Promise<boolean>;
  /** Finds a user by email or creates one signed in through an OAuth provider (no password). */
  upsertOAuthUser(input: {
    id: string;
    email: string;
    displayName: string;
    avatarPath: string | null;
  }): Promise<AuthUser>;
  updateProfile(
    userId: string,
    patch: Partial<Pick<AuthUser, "displayName" | "phone" | "avatarPath" | "password" | "emailVerified">>,
  ): Promise<AuthUser>;
  listAddresses(userId: string): Promise<Address[]>;
  addAddress(userId: string, address: Omit<Address, "id">): Promise<Address[]>;
  listFavorites(userId: string): Promise<string[]>;
  toggleFavorite(userId: string, productSlug: string): Promise<string[]>;
  toProfile(user: AuthUser): ProfileView;
}
