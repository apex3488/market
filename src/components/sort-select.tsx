"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "./ui";

export function SortSelect({
  value,
  label,
  options,
}: {
  value: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      id="sort"
      label={label}
      value={value}
      options={options}
      onChange={(event) => {
        const next = new URLSearchParams(window.location.search);
        next.set("sort", event.target.value);
        router.push(`${pathname}?${next.toString()}`);
      }}
    />
  );
}
