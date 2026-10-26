"use server";

import { redirect } from "next/navigation";
import { adminRepository, orderRepository } from "@market/data";
import { requireAdminUser } from "./session";

async function guard(locale: string) {
  try {
    await requireAdminUser();
  } catch {
    redirect(`/${locale}/account/login`);
  }
}

export async function setProductStatusAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  await guard(locale);
  const slug = String(formData.get("slug") ?? "");
  const status = String(formData.get("status") ?? "draft") === "published" ? "published" : "draft";
  await adminRepository.setProductStatus(slug, status);
  redirect(`/${locale}/admin/products`);
}

export async function setStockAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  await guard(locale);
  const variantId = String(formData.get("variantId") ?? "");
  const stockQuantity = Number(formData.get("stockQuantity") ?? 0);
  await adminRepository.setVariantStock(variantId, stockQuantity);
  redirect(`/${locale}/admin/products`);
}

export async function upsertProductAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  await guard(locale);
  await adminRepository.upsertProduct({
    slug: String(formData.get("slug") ?? "").trim(),
    brandId: String(formData.get("brandId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    titleRu: String(formData.get("titleRu") ?? ""),
    titleEn: String(formData.get("titleEn") ?? ""),
    descriptionRu: String(formData.get("descriptionRu") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    priceUzs: Number(formData.get("priceUzs") ?? 0),
    stockQuantity: Number(formData.get("stockQuantity") ?? 0),
    status: String(formData.get("status") ?? "draft") === "published" ? "published" : "draft",
    featured: formData.get("featured") === "on",
    image: String(formData.get("image") ?? "/demo/phone.jpg"),
  });
  redirect(`/${locale}/admin/products`);
}

export async function updateOrderStatusAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  await guard(locale);
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "pending") as
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled";
  const note = String(formData.get("note") ?? "");
  try {
    await orderRepository.updateStatus(orderId, status, note);
  } catch {
    redirect(`/${locale}/admin/orders/${orderId}?error=status`);
  }
  redirect(`/${locale}/admin/orders/${orderId}`);
}

export async function updatePromoAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  await guard(locale);
  const id = String(formData.get("id") ?? "");
  await adminRepository.updatePromo(id, {
    id,
    problem: String(formData.get("problem") ?? ""),
    agitate: String(formData.get("agitate") ?? ""),
    solution: String(formData.get("solution") ?? ""),
    cta: String(formData.get("cta") ?? ""),
    href: String(formData.get("href") ?? ""),
  });
  redirect(`/${locale}/admin/promos`);
}
