import { cookies } from "next/headers";
import { makeT, type Locale } from "@bayhan/shared";

export const LOCALE_COOKIE = "bm_lang";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return v === "en" ? "en" : "ru";
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: makeT(locale) };
}
