export function formatUzs(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "ru" ? "ru-UZ" : "en-US", {
    style: "currency",
    currency: "UZS",
    maximumFractionDigits: 0,
  }).format(value);
}
