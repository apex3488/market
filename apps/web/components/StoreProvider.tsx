"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError, COMPARE_MAX, errorText, makeT, type Cart, type Locale, type User } from "@bayhan/shared";
import { api, cartToken, safeGet, safeSet, setApiLocale } from "@/lib/api";
import { Icon } from "./Icon";

type Toast = { id: number; text: string; kind: "ok" | "error" };

interface Store {
  locale: Locale;
  t: ReturnType<typeof makeT>;
  user: User | null;
  userLoaded: boolean;
  cart: Cart | null;
  favIds: Set<string>;
  compareIds: string[];
  cartBump: number;
  setLocale: (l: Locale) => void;
  setUser: (u: User | null) => void;
  refreshCart: () => Promise<void>;
  setCart: (c: Cart) => void;
  addToCart: (variantId: string, qty?: number, flyFrom?: HTMLElement | null) => Promise<boolean>;
  toggleFavorite: (productId: string) => Promise<void>;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  logout: () => Promise<void>;
  toast: (text: string, kind?: "ok" | "error") => void;
  errorMessage: (e: unknown) => string;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
};

const COMPARE_KEY = "bm_compare";

export function StoreProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [user, setUser] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartBump, setCartBump] = useState(0);
  const toastId = useRef(0);
  setApiLocale(locale);
  const t = useMemo(() => makeT(locale), [locale]);

  const toast = useCallback((text: string, kind: "ok" | "error" = "ok") => {
    const id = ++toastId.current;
    setToasts((x) => [...x.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2800);
  }, []);

  const errorMessage = useCallback((e: unknown) => errorText(locale, e instanceof ApiError ? e.code : "internal"), [locale]);

  const refreshCart = useCallback(async () => {
    try {
      setCart(await api.cart());
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    api.me().then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setUserLoaded(true));
    refreshCart();
    try {
      const raw = safeGet(COMPARE_KEY);
      if (raw) setCompareIds(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [refreshCart]);

  useEffect(() => {
    if (!user) {
      setFavIds(new Set());
      return;
    }
    api.favoriteIds().then((ids) => setFavIds(new Set(ids))).catch(() => undefined);
    refreshCart();
  }, [user, refreshCart]);

  const setLocale = useCallback(
    (l: Locale) => {
      document.cookie = `bm_lang=${l}; path=/; max-age=31536000; samesite=lax`;
      setLocaleState(l);
      setApiLocale(l);
      document.documentElement.lang = l;
      if (user) api.updateMe({ locale: l }).catch(() => undefined);
      router.refresh();
    },
    [router, user],
  );

  const addToCart = useCallback(
    async (variantId: string, qty = 1, flyFrom?: HTMLElement | null) => {
      try {
        const c = await api.addToCart(variantId, qty);
        setCart(c);
        setCartBump((n) => n + 1);
        if (flyFrom) flyToCart(flyFrom);
        toast(t("product.added"));
        return true;
      } catch (e) {
        toast(errorMessage(e), "error");
        return false;
      }
    },
    [toast, t, errorMessage],
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        toast(t("fav.loginRequired"), "error");
        router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        return;
      }
      const has = favIds.has(productId);
      const next = new Set(favIds);
      if (has) next.delete(productId);
      else next.add(productId);
      setFavIds(next);
      try {
        if (has) await api.removeFavorite(productId);
        else await api.addFavorite(productId);
      } catch (e) {
        setFavIds(favIds);
        toast(errorMessage(e), "error");
      }
    },
    [user, favIds, toast, t, router, errorMessage],
  );

  const toggleCompare = useCallback(
    (productId: string) => {
      setCompareIds((prev) => {
        let next: string[];
        if (prev.includes(productId)) next = prev.filter((x) => x !== productId);
        else if (prev.length >= COMPARE_MAX) {
          toast(t("compare.limit"), "error");
          return prev;
        } else next = [...prev, productId];
        safeSet(COMPARE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [toast, t],
  );

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    safeSet(COMPARE_KEY, null);
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    cartToken.clear();
    setUser(null);
    setCart(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const value: Store = {
    locale, t, user, userLoaded, cart, favIds, compareIds, cartBump,
    setLocale, setUser, refreshCart, setCart, addToCart, toggleFavorite, toggleCompare, clearCompare, logout, toast, errorMessage,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast ${x.kind}`}>
            <span className="ic"><Icon name={x.kind === "ok" ? "check" : "info"} size={18} /></span>
            {x.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** Small "fly to cart" animation from the product image to the cart icon. */
function flyToCart(from: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.querySelector("[data-cart-target]");
  const img = from.querySelector("img") ?? (from.tagName === "IMG" ? from : null);
  if (!target || !img) return;
  const a = img.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const clone = document.createElement("img");
  clone.src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src;
  clone.className = "fly";
  clone.style.left = `${a.left + a.width / 2 - 32}px`;
  clone.style.top = `${a.top + a.height / 2 - 32}px`;
  clone.style.setProperty("--dx", `${b.left + b.width / 2 - (a.left + a.width / 2)}px`);
  clone.style.setProperty("--dy", `${b.top + b.height / 2 - (a.top + a.height / 2)}px`);
  document.body.appendChild(clone);
  setTimeout(() => clone.remove(), 750);
}
