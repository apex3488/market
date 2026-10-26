import { cookies } from "next/headers";
import { cartRepository } from "@market/data";
import { getSessionUser, getSessionUserId } from "./session";

export const GUEST_COOKIE = "velin_guest";

export async function ensureGuestId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  const id = `guest-${crypto.randomUUID()}`;
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return id;
}

export async function getCartOwnerKey(): Promise<string> {
  const user = await getSessionUser();
  if (user) return user.id;
  return ensureGuestId();
}

export async function mergeGuestCartIntoUser(userId: string) {
  const store = await cookies();
  const guestId = store.get(GUEST_COOKIE)?.value;
  if (!guestId || guestId === userId) return;
  await cartRepository.merge(guestId, userId);
  store.delete(GUEST_COOKIE);
}

export async function getCartItemCount(): Promise<number> {
  const store = await cookies();
  const userId = await getSessionUserId();
  const guestId = store.get(GUEST_COOKIE)?.value;
  const ownerKey = userId ?? guestId;
  if (!ownerKey) return 0;
  const cart = await cartRepository.get(ownerKey);
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
