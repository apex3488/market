"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "./ui";

type Option = { value: string; label: string };

export function CatalogFilters({
  brand,
  brands,
  inStock,
  sort,
  labels,
}: {
  brand: string;
  brands: Option[];
  inStock: boolean;
  sort: string;
  labels: {
    brand: string;
    allBrands: string;
    sort: string;
    sortNew: string;
    sortAsc: string;
    sortDesc: string;
    inStock: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();

  function push(next: URLSearchParams) {
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form className="grid gap-4 rounded-[16px] border border-line bg-surface p-4" onSubmit={(event) => event.preventDefault()}>
      <Select
        id="brand"
        label={labels.brand}
        value={brand}
        options={[{ value: "", label: labels.allBrands }, ...brands]}
        onChange={(event) => {
          const next = new URLSearchParams(window.location.search);
          if (event.target.value) next.set("brand", event.target.value);
          else next.delete("brand");
          push(next);
        }}
      />
      <Select
        id="sort"
        label={labels.sort}
        value={sort}
        options={[
          { value: "new", label: labels.sortNew },
          { value: "price_asc", label: labels.sortAsc },
          { value: "price_desc", label: labels.sortDesc },
        ]}
        onChange={(event) => {
          const next = new URLSearchParams(window.location.search);
          next.set("sort", event.target.value);
          push(next);
        }}
      />
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(event) => {
            const next = new URLSearchParams(window.location.search);
            if (event.target.checked) next.set("inStock", "1");
            else next.delete("inStock");
            push(next);
          }}
        />
        {labels.inStock}
      </label>
    </form>
  );
}
