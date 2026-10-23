"use client";
import type { Order, OrderStatus } from "@bayhan/shared";
import { api } from "./api";

export interface AdminProductRow {
  id: string; slug: string; name: string; isActive: boolean; category: string; brand: string; price: number; stock: number; image: string | null;
}
export interface AdminVariant {
  id?: string; sku: string; name: string; options: Record<string, string>; price: number; compareAtPrice: number | null; stock: number; reserved?: number; isDefault: boolean;
}
export interface AdminProduct {
  id?: string; slug: string; name: string; categoryId: string; brandId: string; descriptionRu: string; descriptionEn: string;
  isActive: boolean; isNew: boolean; isFeatured: boolean;
  images: { url: string; alt: string }[];
  specs: { key: string; labelRu: string; labelEn: string; value: string }[];
  variants: AdminVariant[];
}
export interface AdminCategory { id: string; slug: string; nameRu: string; nameEn: string; icon: string; imageUrl: string | null; sortOrder: number; specFilters: string[] }
export interface AdminBrand { id: string; slug: string; name: string; logoUrl: string | null }
export interface AdminPromotion {
  id: string; code: string; kind: "percent" | "fixed"; value: number; minSubtotal: number; startsAt: string | null; endsAt: string | null;
  usageLimit: number | null; usedCount: number; isActive: boolean;
}
export interface AdminOrderRow {
  id: string; number: string; status: OrderStatus; total: number; currency: string; customerName: string; phone: string; city: string;
  paymentMethod: string; deliveryMethod: string; client: string; createdAt: string;
}
export interface AdminCustomer { id: string; name: string; email: string | null; phone: string | null; role: "customer" | "admin"; createdAt: string; orders: number }
export interface AdminStats {
  revenue: number; currency: string; orders: number; customers: number; products: number; openOrders: number;
  lowStock: { sku: string; name: string; free: number }[]; recentOrders: Order[];
}

const r = api.request;
const q = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]);
  return p.size ? `?${p}` : "";
};

export const adminApi = {
  stats: () => r<AdminStats>("GET", "/admin/stats"),
  products: (search?: string) => r<{ items: AdminProductRow[]; total: number; currency: string }>("GET", `/admin/products${q({ q: search })}`),
  product: (id: string) => r<AdminProduct & { id: string }>("GET", `/admin/products/${id}`),
  createProduct: (p: AdminProduct) => r<{ id: string }>("POST", "/admin/products", p),
  updateProduct: (id: string, p: AdminProduct) => r<{ id: string }>("PUT", `/admin/products/${id}`, p),
  archiveProduct: (id: string) => r<{ ok: true }>("DELETE", `/admin/products/${id}`),
  categories: () => r<AdminCategory[]>("GET", "/admin/categories"),
  saveCategory: (c: Omit<AdminCategory, "id"> & { id?: string }) =>
    c.id ? r<AdminCategory>("PUT", `/admin/categories/${c.id}`, strip(c)) : r<AdminCategory>("POST", "/admin/categories", strip(c)),
  deleteCategory: (id: string) => r<{ ok: true }>("DELETE", `/admin/categories/${id}`),
  brands: () => r<AdminBrand[]>("GET", "/admin/brands"),
  saveBrand: (b: Omit<AdminBrand, "id"> & { id?: string }) =>
    b.id ? r<AdminBrand>("PUT", `/admin/brands/${b.id}`, strip(b)) : r<AdminBrand>("POST", "/admin/brands", strip(b)),
  deleteBrand: (id: string) => r<{ ok: true }>("DELETE", `/admin/brands/${id}`),
  promotions: () => r<AdminPromotion[]>("GET", "/admin/promotions"),
  savePromotion: (p: Partial<AdminPromotion>) =>
    p.id ? r<AdminPromotion>("PUT", `/admin/promotions/${p.id}`, strip(p)) : r<AdminPromotion>("POST", "/admin/promotions", strip(p)),
  deletePromotion: (id: string) => r<{ ok: true }>("DELETE", `/admin/promotions/${id}`),
  orders: (search?: string, status?: string) => r<AdminOrderRow[]>("GET", `/admin/orders${q({ q: search, status })}`),
  order: (id: string) => r<Order>("GET", `/admin/orders/${id}`),
  setOrderStatus: (id: string, status: OrderStatus, note?: string) => r<Order>("PATCH", `/admin/orders/${id}/status`, { status, note }),
  customers: (search?: string) => r<AdminCustomer[]>("GET", `/admin/customers${q({ q: search })}`),
  setRole: (id: string, role: "customer" | "admin") => r<{ ok: true }>("PATCH", `/admin/customers/${id}`, { role }),
};

function strip<T extends { id?: string; usedCount?: number; createdAt?: unknown }>(o: T) {
  const { id: _id, usedCount: _u, createdAt: _c, ...rest } = o;
  return rest;
}
