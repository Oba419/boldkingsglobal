"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS, type SortValue } from "@/schemas/catalog";

export function SortSelect({ value }: { value: SortValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Sort by</span>
      <select
        value={value}
        className="input min-h-9 w-auto rounded-full py-1 pr-8 font-medium"
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "newest") next.delete("sort");
          else next.set("sort", e.target.value);
          next.delete("page");
          const s = next.toString();
          router.push(s ? `${pathname}?${s}` : pathname);
        }}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
