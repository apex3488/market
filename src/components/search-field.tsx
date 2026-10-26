"use client";

import { useEffect, useId, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SearchField({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const activeLocale = useLocale();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ slug: string; title: string }[]>([]);
  const canSuggest = query.trim().length >= 2;

  useEffect(() => {
    if (!canSuggest) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/v1/search/suggest?locale=${activeLocale}&q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { suggestions: { slug: string; title: string }[] };
        setSuggestions(data.suggestions);
      } catch {
        // aborted or network error: leave previous suggestions
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeLocale, canSuggest, query]);

  const visibleSuggestions = canSuggest ? suggestions : [];

  return (
    <div className="relative min-w-0 flex-1">
      <form action={`/${locale}/search`} role="search" className="relative">
        <label htmlFor="catalog-search" className="sr-only">
          {t("search")}
        </label>
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" size={18} aria-hidden="true" />
        <input
          id="catalog-search"
          name="q"
          type="search"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listId}
          placeholder={t("searchPlaceholder")}
          className="field pr-3 pl-10"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim().length < 2) setSuggestions([]);
          }}
        />
      </form>
      {visibleSuggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.4rem)] right-0 left-0 z-30 grid gap-1 rounded-[12px] border border-line bg-surface p-2 shadow-lg"
        >
          {visibleSuggestions.map((item) => (
            <li key={item.slug} role="option" aria-selected="false">
              <Link
                href={`/p/${item.slug}`}
                className="block min-h-11 rounded-[10px] px-3 py-2 hover:bg-raised"
                onClick={() => setSuggestions([])}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
