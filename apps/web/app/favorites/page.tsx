"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductCard as P } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { ProductCard, ProductSkeleton } from "@/components/ProductCard";
import { useStore } from "@/components/StoreProvider";
import { api } from "@/lib/api";

export default function FavoritesPage() {
  const { t, user, userLoaded, favIds } = useStore();
  const [items, setItems] = useState<P[] | null>(null);

  useEffect(() => {
    if (user) api.favorites().then(setItems).catch(() => setItems([]));
  }, [user]);

  const visible = items?.filter((p) => favIds.has(p.id));

  return (
    <div className="container">
      <div className="page-head"><h1>{t("fav.title")}</h1></div>
      {userLoaded && !user ? (
        <div className="empty">
          <div className="ic"><Icon name="heart" size={28} /></div>
          <h3>{t("fav.loginRequired")}</h3>
          <Link href="/login?next=/favorites" className="btn btn-primary">{t("auth.login")}</Link>
        </div>
      ) : !visible ? (
        <div className="grid">{Array.from({ length: 4 }, (_, i) => <ProductSkeleton key={i} />)}</div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <div className="ic"><Icon name="heart" size={28} /></div>
          <h3>{t("fav.empty")}</h3>
          <Link href="/catalog" className="btn btn-primary">{t("hero.cta")}</Link>
        </div>
      ) : (
        <div className="grid">{visible.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
