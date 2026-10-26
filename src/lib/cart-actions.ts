"use server";

import { redirect } from "next/navigation";
import { cartRepository, orderRepository } from "@market/data";
import { getCartOwnerKey, mergeGuestCartIntoUser } from "./cart";
import { getSessionUser } from "./session";

export async function addToCartAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
  const ownerKey = await getCartOwnerKey();
  try {
    await cartRepository.add(ownerKey, variantId, quantity);
  } catch {
    redirect(`/${locale}/cart?error=variant`);
  }
  redirect(`/${locale}/cart`);
}

export async function updateCartItemAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const ownerKey = await getCartOwnerKey();
  await cartRepository.setQuantity(ownerKey, variantId, quantity);
  redirect(`/${locale}/cart`);
}

export async function removeCartItemAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  const variantId = String(formData.get("variantId") ?? "");
  const ownerKey = await getCartOwnerKey();
  await cartRepository.remove(ownerKey, variantId);
  redirect(`/${locale}/cart`);
}

export async function checkoutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  const contact = String(formData.get("contact") ?? "").trim();
  const recipient = String(formData.get("recipient") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim() || undefined;
  if (!contact || !recipient || !phone || !city || !street) {
    redirect(`/${locale}/checkout?error=fields`);
  }
  const user = await getSessionUser();
  if (user) await mergeGuestCartIntoUser(user.id);
  const ownerKey = await getCartOwnerKey();
  try {
    const order = await orderRepository.create({
      ownerKey,
      userId: user?.id ?? null,
      contact,
      address: { recipient, phone, city, street },
      paymentMethod: "cod_demo",
      idempotencyKey,
    });
    redirect(`/${locale}/checkout/success?order=${order.id}`);
  } catch (error) {
    const code = error instanceof Error ? error.message : "ERROR";
    if (code === "OUT_OF_STOCK") redirect(`/${locale}/checkout?error=stock`);
    if (code === "EMPTY_CART") redirect(`/${locale}/cart?error=empty`);
    redirect(`/${locale}/checkout?error=order`);
  }
}
