"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "velin-compare";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
  } catch {
    return [];
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeList(next: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

export function CompareToggle({ slug, categorySlug }: { slug: string; categorySlug: string }) {
  const t = useTranslations("compare");
  const list = useSyncExternalStore(subscribe, readList, () => [] as string[]);
  const selected = list.includes(slug);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          let next: string[];
          if (selected) next = list.filter((item) => item !== slug);
          else {
            if (list.length >= 4) {
              window.alert(t("limit"));
              return;
            }
            next = [...list, slug];
          }
          writeList(next);
        }}
      >
        {selected ? t("remove") : t("add")}
      </button>
      {list.length > 0 ? (
        <Link href={`/compare?category=${categorySlug}`} className="text-sm text-muted">
          {t("open", { count: list.length })}
        </Link>
      ) : null}
    </div>
  );
}
