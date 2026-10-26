import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { allowedTransitions, buildCart, isOrderableVariant, reserveStock } from "./mock";
import type { Address, AuthUser, Cart, CartItem, Order, OrderAddress, OrderEvent, OrderStatus } from "./types";
import type { CartRepository, OrderRepository, ProfileView, UserRepository } from "./repositories";

/**
 * Accounts, addresses, favorites, carts and orders live in Neon; the catalog stays in the demo seed.
 * Tables carry a `velin_` prefix so they sit next to the older BAYHAN MARKET tables without touching them.
 */

let client: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function db() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = neon(url);
  }
  return client;
}

async function ensureSchema() {
  const sql = db();
  await sql`create table if not exists velin_users (
    id text primary key,
    email text not null unique,
    display_name text not null,
    role text not null default 'customer',
    password_hash text not null default '',
    phone text not null default '',
    avatar_path text,
    email_verified boolean not null default false,
    google_id text unique,
    created_at timestamptz not null default now()
  )`;
  await sql`create table if not exists velin_addresses (
    id text primary key,
    user_id text not null references velin_users(id) on delete cascade,
    recipient text not null,
    phone text not null,
    city text not null,
    street text not null,
    is_default boolean not null default false,
    created_at timestamptz not null default now()
  )`;
  await sql`create table if not exists velin_favorites (
    user_id text not null references velin_users(id) on delete cascade,
    product_slug text not null,
    created_at timestamptz not null default now(),
    primary key (user_id, product_slug)
  )`;
  await sql`create table if not exists velin_cart_items (
    owner_key text not null,
    variant_id text not null,
    quantity integer not null,
    updated_at timestamptz not null default now(),
    primary key (owner_key, variant_id)
  )`;
  await sql`create sequence if not exists velin_order_number start 1000`;
  await sql`create table if not exists velin_orders (
    id text primary key,
    number text not null unique,
    user_id text references velin_users(id) on delete set null,
    contact text not null,
    status text not null,
    payment_method text not null,
    total_uzs bigint not null,
    address jsonb,
    items jsonb not null,
    events jsonb not null,
    idempotency_key text unique,
    created_at timestamptz not null default now()
  )`;
  await sql`create index if not exists velin_orders_user_idx on velin_orders (user_id, created_at desc)`;
  // The public demo buyer from the README; the demo admin is not seeded because its password is public.
  await sql`insert into velin_users (id, email, display_name, password_hash, phone, email_verified)
    values ('user-customer', 'buyer@velin.demo', 'Азира', ${hashPassword("demo1234")}, '+998901112233', true)
    on conflict (id) do nothing`;
}

function ready() {
  if (!schemaReady) {
    schemaReady = ensureSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  return `scrypt$${salt}$${scryptSync(password, salt, 32).toString("base64url")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLocaleLowerCase())
      .filter(Boolean),
  );
}

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  password_hash: string;
  phone: string;
  avatar_path: string | null;
  email_verified: boolean;
  google_id: string | null;
};

function toAuthUser(row: UserRow): AuthUser {
  // Admin rights come from ADMIN_EMAILS only for Google-linked accounts, whose email Google has proven.
  const isAdmin = row.role === "admin" || (row.google_id !== null && adminEmails().has(row.email));
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: isAdmin ? "admin" : "customer",
    password: row.password_hash,
    phone: row.phone,
    avatarPath: row.avatar_path,
    emailVerified: row.email_verified,
  };
}

async function findUserById(id: string): Promise<AuthUser | null> {
  await ready();
  const rows = (await db()`select * from velin_users where id = ${id}`) as UserRow[];
  return rows[0] ? toAuthUser(rows[0]) : null;
}

async function findUserByEmail(email: string): Promise<AuthUser | null> {
  await ready();
  const rows = (await db()`select * from velin_users where email = ${email.trim().toLocaleLowerCase()}`) as UserRow[];
  return rows[0] ? toAuthUser(rows[0]) : null;
}

type AddressRow = {
  id: string;
  recipient: string;
  phone: string;
  city: string;
  street: string;
  is_default: boolean;
};

function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    recipient: row.recipient,
    phone: row.phone,
    city: row.city,
    street: row.street,
    isDefault: row.is_default,
  };
}

async function listAddresses(userId: string): Promise<Address[]> {
  await ready();
  const rows = (await db()`select * from velin_addresses where user_id = ${userId} order by created_at`) as AddressRow[];
  return rows.map(toAddress);
}

async function listFavorites(userId: string): Promise<string[]> {
  await ready();
  const rows = (await db()`select product_slug from velin_favorites where user_id = ${userId} order by created_at`) as {
    product_slug: string;
  }[];
  return rows.map((row) => row.product_slug);
}

export const userRepository: UserRepository = {
  supportsDemoReset: false,
  async findByEmail(email) {
    const user = await findUserByEmail(email);
    return user ? { id: user.id, email: user.email, displayName: user.displayName, role: user.role } : null;
  },
  findAuthByEmail: findUserByEmail,
  findById: findUserById,
  async list() {
    await ready();
    const rows = (await db()`select * from velin_users order by created_at`) as UserRow[];
    return rows.map(toAuthUser).map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    }));
  },
  async checkPassword(user, password) {
    return verifyPassword(password, user.password);
  },
  async register(input) {
    await ready();
    const email = input.email.trim().toLocaleLowerCase();
    const displayName = input.displayName.trim() || email.split("@")[0] || "buyer";
    const rows = (await db()`insert into velin_users (id, email, display_name, password_hash)
      values (${`user-${randomUUID()}`}, ${email}, ${displayName}, ${hashPassword(input.password)})
      on conflict (email) do nothing
      returning *`) as UserRow[];
    if (!rows[0]) throw new Error("EMAIL_TAKEN");
    return toAuthUser(rows[0]);
  },
  async upsertOAuthUser(input) {
    await ready();
    const email = input.email.trim().toLocaleLowerCase();
    const displayName = input.displayName.trim() || email.split("@")[0] || "buyer";
    const sql = db();
    const linked = (await sql`select * from velin_users where google_id = ${input.id}`) as UserRow[];
    if (linked[0]) return toAuthUser(linked[0]);
    // First Google sign-in for an email that already has an account: Google proves the email, so the
    // account is linked and its password is dropped, locking out anyone who registered that email first.
    const claimed = (await sql`update velin_users
      set google_id = ${input.id}, password_hash = '', email_verified = true,
          avatar_path = coalesce(avatar_path, ${input.avatarPath})
      where email = ${email} and google_id is null
      returning *`) as UserRow[];
    if (claimed[0]) return toAuthUser(claimed[0]);
    const created = (await sql`insert into velin_users (id, email, display_name, avatar_path, email_verified, google_id)
      values (${input.id}, ${email}, ${displayName}, ${input.avatarPath}, true, ${input.id})
      on conflict do nothing
      returning *`) as UserRow[];
    if (created[0]) return toAuthUser(created[0]);
    const existing = await findUserByEmail(email);
    if (!existing) throw new Error("OAUTH_UPSERT_FAILED");
    return existing;
  },
  async updateProfile(userId, patch) {
    await ready();
    const current = await findUserById(userId);
    if (!current) throw new Error("NOT_FOUND");
    const rows = (await db()`update velin_users set
        display_name = ${patch.displayName ?? current.displayName},
        phone = ${patch.phone ?? current.phone},
        avatar_path = ${patch.avatarPath === undefined ? current.avatarPath : patch.avatarPath},
        password_hash = ${patch.password ? hashPassword(patch.password) : current.password},
        email_verified = ${patch.emailVerified ?? current.emailVerified}
      where id = ${userId}
      returning *`) as UserRow[];
    return toAuthUser(rows[0]!);
  },
  listAddresses,
  async addAddress(userId, address) {
    await ready();
    const sql = db();
    if (address.isDefault) await sql`update velin_addresses set is_default = false where user_id = ${userId}`;
    await sql`insert into velin_addresses (id, user_id, recipient, phone, city, street, is_default)
      values (${`addr-${randomUUID()}`}, ${userId}, ${address.recipient}, ${address.phone}, ${address.city},
              ${address.street}, ${address.isDefault})`;
    return listAddresses(userId);
  },
  listFavorites,
  async toggleFavorite(userId, productSlug) {
    await ready();
    const sql = db();
    const removed = await sql`delete from velin_favorites where user_id = ${userId} and product_slug = ${productSlug}
      returning product_slug`;
    if (removed.length === 0) {
      await sql`insert into velin_favorites (user_id, product_slug) values (${userId}, ${productSlug})
        on conflict do nothing`;
    }
    return listFavorites(userId);
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

async function readCart(ownerKey: string): Promise<Cart> {
  await ready();
  const rows = (await db()`select variant_id, quantity from velin_cart_items where owner_key = ${ownerKey}
    order by updated_at`) as { variant_id: string; quantity: number }[];
  return buildCart(
    ownerKey,
    rows.map((row) => [row.variant_id, row.quantity] as [string, number]),
  );
}

async function setQuantity(ownerKey: string, variantId: string, quantity: number) {
  await ready();
  const sql = db();
  if (quantity <= 0) {
    await sql`delete from velin_cart_items where owner_key = ${ownerKey} and variant_id = ${variantId}`;
  } else {
    await sql`insert into velin_cart_items (owner_key, variant_id, quantity) values (${ownerKey}, ${variantId}, ${quantity})
      on conflict (owner_key, variant_id) do update set quantity = excluded.quantity, updated_at = now()`;
  }
  return readCart(ownerKey);
}

export const cartRepository: CartRepository = {
  get: readCart,
  async add(ownerKey, variantId, quantity) {
    if (!isOrderableVariant(variantId)) throw new Error("UNKNOWN_VARIANT");
    await ready();
    await db()`insert into velin_cart_items (owner_key, variant_id, quantity) values (${ownerKey}, ${variantId}, ${quantity})
      on conflict (owner_key, variant_id) do update
      set quantity = velin_cart_items.quantity + excluded.quantity, updated_at = now()`;
    return readCart(ownerKey);
  },
  setQuantity,
  async remove(ownerKey, variantId) {
    return setQuantity(ownerKey, variantId, 0);
  },
  async merge(fromKey, toKey) {
    if (fromKey === toKey) return readCart(toKey);
    await ready();
    const sql = db();
    await sql`insert into velin_cart_items (owner_key, variant_id, quantity)
      select ${toKey}, variant_id, quantity from velin_cart_items where owner_key = ${fromKey}
      on conflict (owner_key, variant_id) do update
      set quantity = velin_cart_items.quantity + excluded.quantity, updated_at = now()`;
    await sql`delete from velin_cart_items where owner_key = ${fromKey}`;
    return readCart(toKey);
  },
};

type OrderRow = {
  id: string;
  number: string;
  user_id: string | null;
  contact: string;
  status: OrderStatus;
  payment_method: "cod_demo";
  total_uzs: string | number;
  address: OrderAddress | null;
  items: CartItem[];
  events: OrderEvent[];
  idempotency_key: string | null;
};

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    userId: row.user_id,
    contact: row.contact,
    status: row.status,
    paymentMethod: row.payment_method,
    totalUzs: Number(row.total_uzs),
    address: row.address,
    items: row.items,
    events: row.events,
    idempotencyKey: row.idempotency_key,
  };
}

async function getOrder(orderId: string): Promise<Order | null> {
  await ready();
  const rows = (await db()`select * from velin_orders where id = ${orderId}`) as OrderRow[];
  return rows[0] ? toOrder(rows[0]) : null;
}

export const orderRepository: OrderRepository = {
  async create(input) {
    await ready();
    const sql = db();
    if (input.idempotencyKey) {
      const existing = (await sql`select * from velin_orders where idempotency_key = ${input.idempotencyKey}`) as OrderRow[];
      if (existing[0]) return toOrder(existing[0]);
    }
    const cart = await readCart(input.ownerKey);
    if (cart.items.length === 0) throw new Error("EMPTY_CART");
    const items = reserveStock(cart.items);
    const [{ n }] = (await sql`select nextval('velin_order_number') as n`) as { n: string }[];
    const events: OrderEvent[] = [{ at: new Date().toISOString(), status: "pending", note: "created" }];
    const rows = (await sql`insert into velin_orders
      (id, number, user_id, contact, status, payment_method, total_uzs, address, items, events, idempotency_key)
      values (${`order-${randomUUID()}`}, ${`VL-${n}`}, ${input.userId}, ${input.contact}, 'pending',
              ${input.paymentMethod ?? "cod_demo"}, ${items.reduce((sum, item) => sum + item.lineTotalUzs, 0)},
              ${input.address ? JSON.stringify(input.address) : null}, ${JSON.stringify(items)},
              ${JSON.stringify(events)}, ${input.idempotencyKey ?? null})
      returning *`) as OrderRow[];
    await sql`delete from velin_cart_items where owner_key = ${input.ownerKey}`;
    return toOrder(rows[0]!);
  },
  async listByUser(userId) {
    await ready();
    const rows = (await db()`select * from velin_orders where user_id = ${userId} order by created_at desc`) as OrderRow[];
    return rows.map(toOrder);
  },
  async getForUser(userId, orderId) {
    const order = await getOrder(orderId);
    return order && order.userId === userId ? order : null;
  },
  async listAll() {
    await ready();
    const rows = (await db()`select * from velin_orders order by created_at desc limit 500`) as OrderRow[];
    return rows.map(toOrder);
  },
  getById: getOrder,
  async updateStatus(orderId, status, note = "") {
    const order = await getOrder(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (!allowedTransitions[order.status].includes(status)) throw new Error("INVALID_STATUS");
    const event: OrderEvent = { at: new Date().toISOString(), status, note: note || status };
    const rows = (await db()`update velin_orders
      set status = ${status}, events = events || ${JSON.stringify([event])}::jsonb
      where id = ${orderId} and status = ${order.status}
      returning *`) as OrderRow[];
    if (!rows[0]) throw new Error("INVALID_STATUS");
    return toOrder(rows[0]);
  },
};

export function neonUnavailable(feature: string): never {
  throw new Error(
    `Neon is not connected (${feature}). Set DATABASE_URL and DATA_SOURCE=neon after creating a Neon project.`,
  );
}
