"use client";

import { useEffect, useRef, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CategoryView } from "@market/data";
import { SearchField } from "./search-field";

export function MobileMenu({ locale, categories }: { locale: string; categories: CategoryView[] }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        <List size={22} aria-hidden="true" />
        <span className="sr-only">{t("menu")}</span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("menu")}
            className="fixed inset-0 z-30 flex justify-end bg-black/60"
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduce ? 1 : 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="flex h-full w-[min(22rem,100%)] flex-col gap-6 bg-surface p-5"
              initial={{ x: reduce ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduce ? 0 : "100%" }}
              transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="brand-mark text-2xl">{t("home")}</p>
                <button ref={closeRef} type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center" onClick={() => setOpen(false)}>
                  <X size={20} aria-hidden="true" />
                  <span className="sr-only">{t("close")}</span>
                </button>
              </div>
              <SearchField locale={locale} />
              <nav className="grid gap-3">
                {categories.map((category) => (
                  <Link key={category.slug} href={`/c/${category.slug}`} className="min-h-11 py-2 text-lg" onClick={() => setOpen(false)}>
                    {category.name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
