import type { Locale, ProductQuery } from "@market/contracts";
import { brands, categories, cloneProducts, promos } from "./seed";
import type { Address, AuthUser, OrderStatus, Product } from "./types";
import type {
  AdminProductInput,
  AdminRepository,
  Cart,
  CartItem,
  CatalogRepository,
  CategoryView,
  CreateOrderInput,
  DemoUser,
  Order,
  OrderRepository,
  ProductCard,
  ProductDetail,
  ProductPage,
  ProfileView,
  PromoView,
  UserRepository,
} from "./repositories";

const seedUsers: AuthUser[] = [
  {
    id: "user-customer",
    email: "buyer@velin.demo",
    displayName: "Азира",
    role: "customer",
    password: "demo1234",
    phone: "+998901112233",
    avatarPath: null,
    emailVerified: true,
  },
  {
    id: "user-admin",
    email: "admin@velin.demo",
    displayName: "Админ",
    role: "admin",
    password: "admin1234",
    phone: "",
    avatarPath: null,
    emailVerified: true,
  },
];

let users = structuredClone(seedUsers);
let catalogProducts = cloneProducts();
const carts = new Map<string, Map<string, number>>();
const orders: Order[] = [];
const favorites = new Map<string, Set<string>>();
const addresses = new Map<string, Address[]>([
  [
    "user-customer",
    [
      {
        id: "addr-1",
        recipient: "Азира",
        phone: "+998901112233",
        city: "Ташкент",
        street: "ул. Амир Темур, 12",
        isDefault: true,
      },
    ],
  ],
]);
let orderSeq = 1000;
let userSeq = 3;
let addressSeq = 2;

export function resetMocks() {
  users = structuredClone(seedUsers);
  catalogProducts = cloneProducts();
  carts.clear();
  orders.splice(0, orders.length);
  favorites.clear();
  addresses.clear();
  addresses.set("user-customer", [
    {
      id: "addr-1",
      recipient: "Азира",
      phone: "+998901112233",
      city: "Ташкент",
      street: "ул. Амир Темур, 12",
      isDefault: true,
    },
  ]);
  orderSeq = 1000;
  userSeq = 3;
  addressSeq = 2;
}

function categoryScope(slug: string): Set<string> {
  const root = categories.find((entry) => entry.slug === slug);
  if (!root) return new Set();
  const ids = new Set<string>([root.id]);
  for (const entry of categories) {
    if (entry.parentId && ids.has(entry.parentId)) ids.add(entry.id);
  }
  return ids;
}

function lowestPrice(product: Product) {
  return Math.min(...product.variants.map((variant) => variant.priceUzs));
}

function totalStock(product: Product) {
  return product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
}

function visible(product: Product, includeDrafts: boolean) {
  if (includeDrafts) return product.status !== "archived";
  return product.status === "published";
}

function toCard(product: Product, locale: Locale): ProductCard {
  const brand = brands.find((entry) => entry.id === product.brandId);
  return {
    slug: product.slug,
    title: product.translations[locale].title,
    brandName: brand?.name ?? product.brandId,
    categorySlug: product.categoryId,
    priceUzs: lowestPrice(product),
    stockQuantity: totalStock(product),
    image: product.image,
    featured: product.featured,
    status: product.status,
  };
}

function toDetail(product: Product, locale: Locale): ProductDetail {
  return {
    ...toCard(product, locale),
    description: product.translations[locale].description,
    specs: product.specs.map((spec) => ({ label: spec.label[locale], value: spec.value[locale] })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      label: variant.label[locale],
      priceUzs: variant.priceUzs,
      stockQuantity: variant.stockQuantity,
    })),
  };
}

function toCategoryView(entry: (typeof categories)[number], locale: Locale): CategoryView {
  const parent = entry.parentId ? categories.find((item) => item.id === entry.parentId) : null;
  return {
    id: entry.id,
    slug: entry.slug,
    parentSlug: parent?.slug ?? null,
    name: entry.translations[locale].name,
    description: entry.translations[locale].description,
    image: entry.image,
    children: categories
      .filter((child) => child.parentId === entry.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((child) => ({ slug: child.slug, name: child.translations[locale].name })),
  };
}

function findVariant(variantId: string) {
  for (const product of catalogProducts) {
    const variant = product.variants.find((entry) => entry.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

/** Prices cart lines against the demo catalog; unknown variants are dropped. */
export function buildCart(ownerKey: string, lines: Iterable<[string, number]>): Cart {
  const items: CartItem[] = [];
  for (const [variantId, quantity] of lines) {
    const found = findVariant(variantId);
    if (!found || quantity <= 0) continue;
    const title = found.product.translations.ru.title;
    items.push({
      variantId,
      sku: found.variant.sku,
      title: `${title}, ${found.variant.label.ru}`,
      unitPriceUzs: found.variant.priceUzs,
      quantity,
      lineTotalUzs: found.variant.priceUzs * quantity,
    });
  }
  return {
    ownerKey,
    items,
    totalUzs: items.reduce((sum, item) => sum + item.lineTotalUzs, 0),
  };
}

export function isOrderableVariant(variantId: string): boolean {
  const found = findVariant(variantId);
  return Boolean(found && found.product.status === "published");
}

/** Checks demo stock for every line, then takes it. Throws UNKNOWN_VARIANT or OUT_OF_STOCK. */
export function reserveStock(items: CartItem[]): CartItem[] {
  for (const item of items) {
    const found = findVariant(item.variantId);
    if (!found || found.product.status !== "published") throw new Error("UNKNOWN_VARIANT");
    if (found.variant.stockQuantity < item.quantity) throw new Error("OUT_OF_STOCK");
  }
  return items.map((item) => {
    const found = findVariant(item.variantId)!;
    found.variant.stockQuantity -= item.quantity;
    return {
      variantId: item.variantId,
      sku: found.variant.sku,
      title: item.title,
      unitPriceUzs: found.variant.priceUzs,
      quantity: item.quantity,
      lineTotalUzs: found.variant.priceUzs * item.quantity,
    };
  });
}

function readCart(ownerKey: string): Cart {
  return buildCart(ownerKey, carts.get(ownerKey) ?? new Map<string, number>());
}

function filterProducts(query: ProductQuery) {
  const includeDrafts = query.includeDrafts ?? false;
  let list = catalogProducts.filter((product) => visible(product, includeDrafts));
  if (query.category) {
    const scope = categoryScope(query.category);
    list = list.filter((product) => scope.has(product.categoryId));
  }
  if (query.brand) {
    list = list.filter((product) => product.brandId === query.brand);
  }
  if (query.q) {
    const needle = query.q.toLocaleLowerCase();
    list = list.filter((product) => {
      const blob = [
        product.translations.ru.title,
        product.translations.en.title,
        product.slug,
        ...product.variants.map((variant) => variant.sku),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return blob.includes(needle);
    });
  }
  if (query.inStock) {
    list = list.filter((product) => totalStock(product) > 0);
  }
  const sort = query.sort ?? "new";
  return [...list].sort((a, b) => {
    if (sort === "price_asc") return lowestPrice(a) - lowestPrice(b);
    if (sort === "price_desc") return lowestPrice(b) - lowestPrice(a);
    return catalogProducts.indexOf(b) - catalogProducts.indexOf(a);
  });
}

function toPublic(user: AuthUser): DemoUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export const catalogRepository: CatalogRepository = {
  async listCategories(locale) {
    return categories
      .filter((entry) => entry.parentId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((entry) => toCategoryView(entry, locale));
  },

  async getCategory(locale, slug) {
    const entry = categories.find((item) => item.slug === slug);
    return entry ? toCategoryView(entry, locale) : null;
  },

  async listBrands() {
    return brands;
  },

  async listProducts(locale, query) {
    return filterProducts(query).map((product) => toCard(product, locale));
  },

  async listProductsPage(locale, query): Promise<ProductPage> {
    const all = filterProducts(query);
    const pageSize = query.pageSize ?? 12;
    const page = query.page ?? 1;
    const pageCount = Math.max(1, Math.ceil(all.length / pageSize));
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize).map((product) => toCard(product, locale)),
      total: all.length,
      page,
      pageSize,
      pageCount,
    };
  },

  async getBySlug(locale, slug, includeDrafts = false) {
    const product = catalogProducts.find((entry) => entry.slug === slug);
    if (!product || !visible(product, includeDrafts)) return null;
    return toDetail(product, locale);
  },

  async getBySlugs(locale, slugs) {
    const items: ProductDetail[] = [];
    for (const slug of slugs) {
      const product = await this.getBySlug(locale, slug, false);
      if (product) items.push(product);
    }
    return items;
  },

  async suggest(locale, q) {
    const items = await this.listProducts(locale, { q, sort: "new", includeDrafts: false, page: 1, pageSize: 8 });
    return items.slice(0, 8).map((item) => ({ slug: item.slug, title: item.title }));
  },

  async listPromos(locale): Promise<PromoView[]> {
    return promos.map((promo) => ({
      id: promo.id,
      href: promo.href,
      image: promo.image,
      problem: promo.problem[locale],
      agitate: promo.agitate[locale],
      solution: promo.solution[locale],
      cta: promo.cta[locale],
    }));
  },
};

export const cartRepository = {
  async get(ownerKey: string) {
    return readCart(ownerKey);
  },
  async add(ownerKey: string, variantId: string, quantity: number) {
    if (!isOrderableVariant(variantId)) throw new Error("UNKNOWN_VARIANT");
    const lines = carts.get(ownerKey) ?? new Map<string, number>();
    lines.set(variantId, (lines.get(variantId) ?? 0) + quantity);
    carts.set(ownerKey, lines);
    return readCart(ownerKey);
  },
  async setQuantity(ownerKey: string, variantId: string, quantity: number) {
    const lines = carts.get(ownerKey) ?? new Map<string, number>();
    if (quantity <= 0) lines.delete(variantId);
    else lines.set(variantId, quantity);
    carts.set(ownerKey, lines);
    return readCart(ownerKey);
  },
  async remove(ownerKey: string, variantId: string) {
    return this.setQuantity(ownerKey, variantId, 0);
  },
  async merge(fromKey: string, toKey: string) {
    if (fromKey === toKey) return readCart(toKey);
    const from = carts.get(fromKey);
    if (!from || from.size === 0) return readCart(toKey);
    const to = carts.get(toKey) ?? new Map<string, number>();
    for (const [variantId, quantity] of from) {
      to.set(variantId, (to.get(variantId) ?? 0) + quantity);
    }
    carts.set(toKey, to);
    carts.delete(fromKey);
    return readCart(toKey);
  },
};

export const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const orderRepository: OrderRepository = {
  async create(input: CreateOrderInput) {
    if (input.idempotencyKey) {
      const existing = orders.find((order) => order.idempotencyKey === input.idempotencyKey);
      if (existing) return structuredClone(existing);
    }
    const cart = readCart(input.ownerKey);
    if (cart.items.length === 0) throw new Error("EMPTY_CART");
    const pricedItems = reserveStock(cart.items);
    const now = new Date().toISOString();
    const order: Order = {
      id: `order-${orderSeq}`,
      number: `VL-${orderSeq}`,
      userId: input.userId,
      contact: input.contact,
      status: "pending",
      paymentMethod: input.paymentMethod ?? "cod_demo",
      totalUzs: pricedItems.reduce((sum, item) => sum + item.lineTotalUzs, 0),
      address: input.address ? { ...input.address } : null,
      items: pricedItems,
      events: [{ at: now, status: "pending", note: "created" }],
      idempotencyKey: input.idempotencyKey ?? null,
    };
    orderSeq += 1;
    orders.push(order);
    carts.delete(input.ownerKey);
    return structuredClone(order);
  },
  async listByUser(userId) {
    return orders.filter((order) => order.userId === userId).map((order) => structuredClone(order));
  },
  async getForUser(userId, orderId) {
    const order = orders.find((entry) => entry.id === orderId && entry.userId === userId);
    return order ? structuredClone(order) : null;
  },
  async listAll() {
    return orders.map((order) => structuredClone(order));
  },
  async getById(orderId) {
    const order = orders.find((entry) => entry.id === orderId);
    return order ? structuredClone(order) : null;
  },
  async updateStatus(orderId, status, note = "") {
    const order = orders.find((entry) => entry.id === orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (!allowedTransitions[order.status].includes(status)) throw new Error("INVALID_STATUS");
    order.status = status;
    order.events.push({ at: new Date().toISOString(), status, note: note || status });
    return structuredClone(order);
  },
};

export const adminRepository: AdminRepository = {
  async listProducts() {
    return catalogProducts.map((product) => toDetail(product, "ru"));
  },
  async setProductStatus(slug, status) {
    const product = catalogProducts.find((entry) => entry.slug === slug);
    if (!product) throw new Error("NOT_FOUND");
    product.status = status;
  },
  async setVariantStock(variantId, stockQuantity) {
    const found = findVariant(variantId);
    if (!found) throw new Error("NOT_FOUND");
    found.variant.stockQuantity = Math.max(0, stockQuantity);
  },
  async upsertProduct(input: AdminProductInput) {
    let product = catalogProducts.find((entry) => entry.slug === input.slug);
    if (!product) {
      product = {
        id: `prod-${input.slug}`,
        slug: input.slug,
        brandId: input.brandId,
        categoryId: input.categoryId,
        status: input.status,
        featured: input.featured,
        image: input.image,
        translations: {
          ru: { title: input.titleRu, description: input.descriptionRu },
          en: { title: input.titleEn, description: input.descriptionEn },
        },
        specs: [
          {
            label: { ru: "Тип", en: "Type" },
            value: { ru: "Демо", en: "Demo" },
          },
        ],
        variants: [
          {
            id: `${input.slug}-base`,
            sku: `${input.slug.toUpperCase()}-BASE`,
            label: { ru: "Базовая", en: "Base" },
            priceUzs: input.priceUzs,
            stockQuantity: input.stockQuantity,
          },
        ],
      };
      catalogProducts.push(product);
    } else {
      product.brandId = input.brandId;
      product.categoryId = input.categoryId;
      product.status = input.status;
      product.featured = input.featured;
      product.image = input.image;
      product.translations.ru = { title: input.titleRu, description: input.descriptionRu };
      product.translations.en = { title: input.titleEn, description: input.descriptionEn };
      const variant = product.variants[0];
      if (variant) {
        variant.priceUzs = input.priceUzs;
        variant.stockQuantity = input.stockQuantity;
      }
    }
    return toDetail(product, "ru");
  },
  async listPromos(locale) {
    return catalogRepository.listPromos(locale);
  },
  async updatePromo(id, patch) {
    const promo = promos.find((entry) => entry.id === id);
    if (!promo) throw new Error("NOT_FOUND");
    if (patch.href) promo.href = patch.href;
    if (patch.image) promo.image = patch.image;
    if (patch.problem) {
      promo.problem.ru = patch.problem;
      promo.problem.en = patch.problem;
    }
    if (patch.agitate) {
      promo.agitate.ru = patch.agitate;
      promo.agitate.en = patch.agitate;
    }
    if (patch.solution) {
      promo.solution.ru = patch.solution;
      promo.solution.en = patch.solution;
    }
    if (patch.cta) {
      promo.cta.ru = patch.cta;
      promo.cta.en = patch.cta;
    }
  },
};

export const userRepository: UserRepository = {
  async findByEmail(email) {
    const user = users.find((entry) => entry.email === email.toLocaleLowerCase());
    return user ? toPublic(user) : null;
  },
  async findAuthByEmail(email) {
    return users.find((entry) => entry.email === email.toLocaleLowerCase()) ?? null;
  },
  async findById(id) {
    return users.find((entry) => entry.id === id) ?? null;
  },
  async list() {
    return users.map(toPublic);
  },
  async register(input) {
    const email = input.email.trim().toLocaleLowerCase();
    if (users.some((entry) => entry.email === email)) throw new Error("EMAIL_TAKEN");
    const user: AuthUser = {
      id: `user-${userSeq}`,
      email,
      displayName: input.displayName.trim() || email.split("@")[0] || "buyer",
      role: "customer",
      password: input.password,
      phone: "",
      avatarPath: null,
      emailVerified: false,
    };
    userSeq += 1;
    users.push(user);
    return user;
  },
  supportsDemoReset: true,
  async checkPassword(user, password) {
    return user.password !== "" && user.password === password;
  },
  async upsertOAuthUser(input) {
    const email = input.email.trim().toLocaleLowerCase();
    const existing = users.find((entry) => entry.email === email || entry.id === input.id);
    if (existing) return existing;
    const user: AuthUser = {
      id: input.id,
      email,
      displayName: input.displayName.trim() || email.split("@")[0] || "buyer",
      role: "customer",
      password: "",
      phone: "",
      avatarPath: input.avatarPath,
      emailVerified: true,
    };
    users.push(user);
    return user;
  },
  async updateProfile(userId, patch) {
    const user = users.find((entry) => entry.id === userId);
    if (!user) throw new Error("NOT_FOUND");
    Object.assign(user, patch);
    return user;
  },
  async listAddresses(userId) {
    return structuredClone(addresses.get(userId) ?? []);
  },
  async addAddress(userId, address) {
    const list = addresses.get(userId) ?? [];
    const next: Address = { ...address, id: `addr-${addressSeq}` };
    addressSeq += 1;
    if (next.isDefault) {
      for (const item of list) item.isDefault = false;
    }
    list.push(next);
    addresses.set(userId, list);
    return structuredClone(list);
  },
  async listFavorites(userId) {
    return [...(favorites.get(userId) ?? new Set())];
  },
  async toggleFavorite(userId, productSlug) {
    const set = favorites.get(userId) ?? new Set<string>();
    if (set.has(productSlug)) set.delete(productSlug);
    else set.add(productSlug);
    favorites.set(userId, set);
    return [...set];
  },
  toProfile(user): ProfileView {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      avatarPath: user.avatarPath,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  },
};

export function parseQuery(input: Partial<ProductQuery>): ProductQuery {
  return {
    category: input.category,
    brand: input.brand,
    q: input.q,
    sort: input.sort ?? "new",
    includeDrafts: input.includeDrafts ?? false,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 12,
    inStock: input.inStock,
  };
}
