"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";

export function CompareClient({ category }: { category: string }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    try {
      const raw = window.localStorage.getItem("velin-compare");
      const slugs = raw ? (JSON.parse(raw) as string[]) : [];
      if (Array.isArray(slugs) && slugs.length > 0) {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        params.set("slugs", slugs.slice(0, 4).join(","));
        router.replace(`/compare?${params.toString()}`);
      }
    } catch {
      // ignore broken localStorage
    }
  }, [category, router]);

  return null;
}
