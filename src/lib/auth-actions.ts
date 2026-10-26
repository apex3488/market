"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { userRepository } from "@market/data";
import { mergeGuestCartIntoUser } from "./cart";
import { SESSION_COOKIE } from "./session";

async function setSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "ru");
  const user = await userRepository.findAuthByEmail(email);
  if (!user || user.password !== password) {
    redirect(`/${locale}/account/login?error=invalid`);
  }
  await setSession(user.id);
  await mergeGuestCartIntoUser(user.id);
  redirect(`/${locale}/account`);
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const locale = String(formData.get("locale") ?? "ru");
  if (password.length < 6) redirect(`/${locale}/account/register?error=password`);
  try {
    const user = await userRepository.register({ email, password, displayName });
    await setSession(user.id);
    await mergeGuestCartIntoUser(user.id);
  } catch {
    redirect(`/${locale}/account/register?error=taken`);
  }
  redirect(`/${locale}/account`);
}

export async function logoutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  await clearSession();
  redirect(`/${locale}/account/login`);
}

export async function verifyEmailAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) redirect(`/${locale}/account/login`);
  await userRepository.updateProfile(userId, { emailVerified: true });
  redirect(`/${locale}/account?verified=1`);
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "ru");
  const user = await userRepository.findAuthByEmail(email);
  if (!user) redirect(`/${locale}/account/reset?error=missing`);
  if (password.length < 6) redirect(`/${locale}/account/reset?error=password`);
  await userRepository.updateProfile(user.id, { password });
  redirect(`/${locale}/account/login?reset=1`);
}

export async function updateProfileAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) redirect(`/${locale}/account/login`);
  const displayName = String(formData.get("displayName") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  await userRepository.updateProfile(userId, {
    displayName,
    phone,
    ...(password.length >= 6 ? { password } : {}),
  });
  redirect(`/${locale}/account/profile?saved=1`);
}

export async function addAddressAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) redirect(`/${locale}/account/login`);
  await userRepository.addAddress(userId, {
    recipient: String(formData.get("recipient") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    city: String(formData.get("city") ?? ""),
    street: String(formData.get("street") ?? ""),
    isDefault: formData.get("isDefault") === "on",
  });
  redirect(`/${locale}/account/addresses`);
}

export async function toggleFavoriteAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ru");
  const slug = String(formData.get("slug") ?? "");
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) redirect(`/${locale}/account/login`);
  await userRepository.toggleFavorite(userId, slug);
  const back = String(formData.get("back") ?? `/${locale}/p/${slug}`);
  redirect(back);
}
