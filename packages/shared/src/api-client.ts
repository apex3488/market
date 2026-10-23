import type { ClientKind, Locale } from "./constants";
import type { AddressInput } from "./api-types";
import type {
  AuthResponse,
  Brand,
  Cart,
  Category,
  CreateOrderResponse,
  HomeResponse,
  Order,
  ProductCard,
  ProductDetail,
  ProductListResponse,
  PublicConfig,
  Quote,
  Review,
  User,
} from "./types";
import type { CheckoutInput, ProductQuery, RegisterInput } from "./schemas";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export interface ApiClientOptions {
  baseUrl: string; // e.g. "https://api.example.com" or "" for same-origin
  client: ClientKind;
  getToken?: () => string | null | undefined;
  getCartToken?: () => string | null | undefined;
  setCartToken?: (token: string) => void;
  getLocale?: () => Locale;
  /** Web uses httpOnly cookies via same-origin proxy. */
  credentials?: RequestCredentials;
  fetchImpl?: typeof fetch;
}

type Query = Record<string, string | number | boolean | undefined | null>;

function qs(q?: Query) {
  if (!q) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function createApiClient(opts: ApiClientOptions) {
  const f = opts.fetchImpl ?? fetch;

  async function request<T>(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = { "X-BM-Client": opts.client, ...extraHeaders };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = opts.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    const cartToken = opts.getCartToken?.();
    if (cartToken) headers["X-Cart-Token"] = cartToken;
    const locale = opts.getLocale?.();
    if (locale) headers["X-Lang"] = locale;
    let res: Response;
    try {
      res = await f(`${opts.baseUrl}/api/v1${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: opts.credentials,
      });
    } catch {
      throw new ApiError(0, "network", "Network error");
    }
    const newCartToken = res.headers.get("X-Cart-Token");
    if (newCartToken) opts.setCartToken?.(newCartToken);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const e = data?.error ?? {};
      throw new ApiError(res.status, e.code ?? "internal", e.message ?? res.statusText, e.fields);
    }
    return data as T;
  }

  const lang = () => opts.getLocale?.();

  return {
    request,
    config: () => request<PublicConfig>("GET", "/config"),
    home: () => request<HomeResponse>("GET", `/home${qs({ lang: lang() })}`),
    categories: () => request<Category[]>("GET", `/categories${qs({ lang: lang() })}`),
    brands: () => request<Brand[]>("GET", "/brands"),
    products: (q: ProductQuery = {}) => request<ProductListResponse>("GET", `/products${qs({ ...q, lang: lang() })}`),
    product: (slug: string) => request<ProductDetail>("GET", `/products/${encodeURIComponent(slug)}${qs({ lang: lang() })}`),
    related: (slug: string) => request<ProductCard[]>("GET", `/products/${encodeURIComponent(slug)}/related${qs({ lang: lang() })}`),
    suggest: (q: string) => request<ProductCard[]>("GET", `/search/suggest${qs({ q, lang: lang() })}`),
    reviews: (slug: string) => request<Review[]>("GET", `/products/${encodeURIComponent(slug)}/reviews`),
    addReview: (slug: string, rating: number, text: string) =>
      request<Review>("POST", `/products/${encodeURIComponent(slug)}/reviews`, { rating, text }),

    register: (input: Partial<RegisterInput>) => request<AuthResponse>("POST", "/auth/register", input),
    login: (identifier: string, password: string, cartToken?: string | null) =>
      request<AuthResponse>("POST", "/auth/login", { identifier, password, cartToken: cartToken ?? undefined }),
    telegramAuth: (initData: string, cartToken?: string | null) =>
      request<AuthResponse>("POST", "/auth/telegram", { initData, cartToken: cartToken ?? undefined }),
    logout: () => request<{ ok: true }>("POST", "/auth/logout", {}),
    me: () => request<{ user: User | null }>("GET", "/auth/me"),
    updateMe: (input: { name?: string; locale?: Locale }) => request<{ user: User }>("PATCH", "/auth/me", input),
    forgot: (identifier: string) => request<{ ok: true }>("POST", "/auth/password/forgot", { identifier, locale: lang() }),
    reset: (token: string, password: string) => request<{ ok: true }>("POST", "/auth/password/reset", { token, password }),

    cart: () => request<Cart>("GET", "/cart"),
    addToCart: (variantId: string, quantity = 1) => request<Cart>("POST", "/cart/items", { variantId, quantity }),
    setCartQty: (variantId: string, quantity: number) => request<Cart>("PATCH", `/cart/items/${variantId}`, { quantity }),
    removeFromCart: (variantId: string) => request<Cart>("DELETE", `/cart/items/${variantId}`),
    clearCart: () => request<Cart>("DELETE", "/cart"),

    favorites: () => request<ProductCard[]>("GET", `/favorites${qs({ lang: lang() })}`),
    favoriteIds: () => request<string[]>("GET", "/favorites/ids"),
    addFavorite: (productId: string) => request<{ ok: true }>("PUT", `/favorites/${productId}`, {}),
    removeFavorite: (productId: string) => request<{ ok: true }>("DELETE", `/favorites/${productId}`),

    quote: (deliveryMethod: string, promoCode?: string) => request<Quote>("POST", "/checkout/quote", { deliveryMethod, promoCode }),
    createOrder: (input: Partial<CheckoutInput>, idempotencyKey: string) =>
      request<CreateOrderResponse>("POST", "/orders", input, { "Idempotency-Key": idempotencyKey }),
    orders: () => request<Order[]>("GET", "/orders"),
    order: (id: string) => request<Order>("GET", `/orders/${id}`),
    payOrder: (id: string, client: ClientKind) =>
      request<{ confirmationUrl: string | null }>("POST", `/orders/${id}/pay`, { client }),
    cancelOrder: (id: string) => request<Order>("POST", `/orders/${id}/cancel`, {}),

    addresses: () => request<(AddressInput & { id: string })[]>("GET", "/addresses"),
    addAddress: (a: AddressInput) => request<AddressInput & { id: string }>("POST", "/addresses", a),
    deleteAddress: (id: string) => request<{ ok: true }>("DELETE", `/addresses/${id}`),

    registerPushToken: (token: string, platform: "ios" | "android" | "web") =>
      request<{ ok: true }>("POST", "/push-tokens", { token, platform }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
