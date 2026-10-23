import type { Locale } from "./constants";

const CURRENCY_LABEL: Record<string, { ru: string; en: string }> = {
  UZS: { ru: "сум", en: "UZS" },
  RUB: { ru: "₽", en: "RUB" },
  USD: { ru: "$", en: "USD" },
};

/** Format minor units (1/100) as human readable price. */
export function formatPrice(minor: number, currency: string, locale: Locale = "ru"): string {
  const major = minor / 100;
  const digits = currency === "UZS" ? 0 : Number.isInteger(major) ? 0 : 2;
  const n = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(major);
  const label = CURRENCY_LABEL[currency]?.[locale] ?? currency;
  return `${n} ${label}`;
}

export function formatDate(iso: string, locale: Locale = "ru"): string {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Unsplash-style CDN resize helper; leaves other URLs untouched. */
export function img(url: string | null | undefined, width = 600): string {
  if (!url) return "";
  if (url.includes("images.unsplash.com")) {
    const base = url.split("?")[0];
    return `${base}?auto=format&fit=crop&w=${width}&q=75`;
  }
  return url;
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}
