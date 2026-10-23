"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { TKey } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/StoreProvider";

const NAV: [string, TKey, string][] = [
  ["/admin", "admin.dashboard", "chart"],
  ["/admin/orders", "admin.orders", "package"],
  ["/admin/products", "admin.products", "box"],
  ["/admin/categories", "admin.categories", "grid"],
  ["/admin/brands", "admin.brands", "tag"],
  ["/admin/promotions", "admin.promotions", "percent"],
  ["/admin/customers", "admin.customers", "users"],
];

/** UI guard only — every admin API route is independently protected on the server. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, user, userLoaded } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (userLoaded && !user) router.replace("/login?next=/admin");
  }, [userLoaded, user, router]);

  if (!userLoaded || !user) return <div className="container section"><div className="skel" style={{ height: 400 }} /></div>;
  if (user.role !== "admin") {
    return (
      <div className="container section">
        <div className="empty">
          <div className="ic"><Icon name="shield" size={28} /></div>
          <h3>{t("err.forbidden")}</h3>
          <Link href="/" className="btn btn-ghost">{t("nav.home")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin">
      <nav className="card admin-nav" aria-label={t("admin.title")}>
        {NAV.map(([href, key, icon]) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={active ? "active" : ""}>
              <Icon name={icon} size={18} /> {t(key)}
            </Link>
          );
        })}
      </nav>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}
