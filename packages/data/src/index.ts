import * as mock from "./mock";
import * as neon from "./neon";

/**
 * Accounts, carts and orders go to Neon when DATABASE_URL is a Postgres URL; DATA_SOURCE=mock forces the
 * in-memory demo. Other values (such as a leftover local file path) fall back to mocks.
 */
export const dataSource: "neon" | "mock" =
  /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "") && process.env.DATA_SOURCE !== "mock" ? "neon" : "mock";

const store = dataSource === "neon" ? neon : mock;

export const userRepository = store.userRepository;
export const cartRepository = store.cartRepository;
export const orderRepository = store.orderRepository;
export { adminRepository, catalogRepository, resetMocks } from "./mock";
export { assertAdmin, assertOwnResource } from "./access";
export { neonUnavailable } from "./neon";
export type {
  Address,
  AdminProductInput,
  AdminRepository,
  AuthUser,
  Brand,
  Cart,
  CartItem,
  CartRepository,
  CatalogRepository,
  CategoryView,
  CreateOrderInput,
  DemoUser,
  Order,
  OrderAddress,
  OrderEvent,
  OrderRepository,
  OrderStatus,
  ProductCard,
  ProductDetail,
  ProductPage,
  ProfileView,
  PromoView,
  UserRepository,
} from "./repositories";
