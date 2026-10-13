import { z } from "zod";
import { parseNairaToKobo } from "@/lib/money";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const toArray = (v: unknown) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

const nairaParam = z
  .unknown()
  .transform((v) => {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) return undefined;
    try {
      return parseNairaToKobo(s);
    } catch {
      return undefined;
    }
  });

/**
 * Parses catalog URL search params. Invalid values are dropped rather than
 * failing the page, so a hand-edited URL still renders a sensible listing.
 */
export const catalogQuerySchema = z.object({
  q: z
    .unknown()
    .transform((v) => (typeof v === "string" ? v.trim().slice(0, 100) : ""))
    .optional(),
  category: z
    .unknown()
    .transform((v) => (typeof v === "string" && /^[a-z0-9-]{1,80}$/.test(v) ? v : undefined))
    .optional(),
  brand: z
    .unknown()
    .transform((v) => toArray(v).filter((b): b is string => typeof b === "string" && b.length > 0 && b.length <= 60).slice(0, 20))
    .optional(),
  min: nairaParam.optional(),
  max: nairaParam.optional(),
  inStock: z
    .unknown()
    .transform((v) => v === "1" || v === "true")
    .optional(),
  sort: z
    .unknown()
    .transform((v): SortValue => (v === "price-asc" || v === "price-desc" ? v : "newest"))
    .optional(),
  page: z
    .unknown()
    .transform((v) => {
      const n = Number(typeof v === "string" ? v : 1);
      return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : 1;
    })
    .optional(),
});

export type CatalogQuery = {
  q: string;
  category?: string;
  brand: string[];
  min?: number;
  max?: number;
  inStock: boolean;
  sort: SortValue;
  page: number;
};

export function parseCatalogQuery(params: Record<string, string | string[] | undefined>): CatalogQuery {
  const r = catalogQuerySchema.parse(params);
  return {
    q: r.q ?? "",
    category: r.category,
    brand: r.brand ?? [],
    min: r.min,
    max: r.max,
    inStock: r.inStock ?? false,
    sort: r.sort ?? "newest",
    page: r.page ?? 1,
  };
}
