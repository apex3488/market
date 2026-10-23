"use client";
import { createApiClient, type Locale } from "@bayhan/shared";

const CART_KEY = "bm_cart_token";
let currentLocale: Locale = "ru";
export const setApiLocale = (l: Locale) => {
  currentLocale = l;
};

function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export const cartToken = {
  get: () => safeGet(CART_KEY),
  clear: () => safeSet(CART_KEY, null),
};

/** Same-origin client: requests go through the Next.js rewrite, the session is an httpOnly cookie. */
export const api = createApiClient({
  baseUrl: "",
  client: "web",
  credentials: "same-origin",
  getCartToken: () => safeGet(CART_KEY),
  setCartToken: (t) => safeSet(CART_KEY, t),
  getLocale: () => currentLocale,
});

export { safeGet, safeSet };
