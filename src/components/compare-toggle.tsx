"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "velin-compare";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

// The snapshot must be stable between calls, so it is the raw stored string; parsing happens per render.
function readRaw(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function parseList(raw: string): string[] {
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]).slice(0, 4) : [];
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
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const list = useMemo(() => parseList(raw), [raw]);
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
