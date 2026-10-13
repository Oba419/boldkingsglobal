import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal } from "lucide-react";
import type { CatalogQuery } from "@/schemas/catalog";
import { koboToInputValue } from "@/lib/money";
import type { CategoryDTO, ProductListResult } from "@/types/catalog";
import { ProductGrid } from "./product-card";
import { SortSelect } from "./sort-select";
import { PageHero } from "./page-hero";

type Props = {
  title: string;
  description?: string | null;
  basePath: string;
  query: CatalogQuery;
  result: ProductListResult;
  brands: string[];
  /** Shown only on /shop — category pages fix the category in the path. */
  categories?: CategoryDTO[];
};

/** Serialises the query back to URL params, optionally overriding fields. */
export function catalogHref(basePath: string, query: CatalogQuery, override: Partial<CatalogQuery> = {}, includeCategory = true): string {
  const q = { ...query, ...override };
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (includeCategory && q.category) p.set("category", q.category);
  for (const b of q.brand) p.append("brand", b);
  if (q.min !== undefined) p.set("min", koboToInputValue(q.min));
  if (q.max !== undefined) p.set("max", koboToInputValue(q.max));
  if (q.inStock) p.set("inStock", "1");
  if (q.sort !== "newest") p.set("sort", q.sort);
  if (q.page > 1) p.set("page", String(q.page));
  const s = p.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function CatalogView({ title, description, basePath, query, result, brands, categories }: Props) {
  const includeCategory = Boolean(categories);
  const hasFilters = query.brand.length > 0 || query.min !== undefined || query.max !== undefined || query.inStock || (includeCategory && query.category);

  return (
    <>
    <PageHero
      title={query.q ? `Results for “${query.q}”` : title}
      description={description}
      eyebrow={query.q ? "Search" : "Collection"}
      crumbs={query.q ? [{ href: "/shop", label: "Shop" }, { label: "Search" }] : [{ label: title }]}
    />
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="self-start lg:sticky lg:top-36">
          {/* Mobile: collapsible. Desktop: always visible. */}
          <details className="group card lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-gold-600" aria-hidden /> Filters
                {hasFilters ? <span className="size-2 rounded-full bg-gold-500" aria-label="active" /> : null}
              </span>
              <span className="text-sm font-normal text-muted group-open:hidden">Show</span>
              <span className="hidden text-sm font-normal text-muted group-open:inline">Hide</span>
            </summary>
            <FiltersForm idPrefix="m" basePath={basePath} query={query} brands={brands} categories={categories} />
          </details>
          <aside className="card hidden lg:block" aria-label="Filters">
            <p className="flex items-center gap-2 border-b border-line px-5 py-4 text-sm font-semibold">
              <SlidersHorizontal className="size-4 text-gold-600" aria-hidden /> Refine results
            </p>
            <FiltersForm idPrefix="d" basePath={basePath} query={query} brands={brands} categories={categories} />
          </aside>
        </div>

        <section aria-label="Products">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-card">
            <p className="text-sm text-muted" aria-live="polite">
              {result.total === 0 ? (
                "No products found"
              ) : (
                <>
                  <span className="font-semibold text-ink">{result.total}</span> product{result.total === 1 ? "" : "s"}
                </>
              )}
            </p>
            <SortSelect value={query.sort} />
          </div>

          {result.items.length ? (
            <ProductGrid products={result.items} priorityCount={4} />
          ) : (
            <div className="card flex animate-fade-up flex-col items-center gap-3 px-6 py-20 text-center">
              <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-gold-500/10 ring-1 ring-gold-500/25">
                <SearchX className="size-7 text-gold-600" aria-hidden />
              </span>
              <p className="text-lg font-semibold">Nothing matches your search yet.</p>
              <p className="max-w-md text-sm text-muted">Try fewer filters or a different search term. If you&apos;re looking for something specific, call or WhatsApp us — we may be able to source it.</p>
              <div className="flex gap-2">
                {hasFilters || query.q ? (
                  <Link href={basePath} className="btn-outline">
                    Clear filters
                  </Link>
                ) : null}
                <Link href="/contact" className="btn-primary">
                  Ask us
                </Link>
              </div>
            </div>
          )}

          {result.pageCount > 1 ? (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
              {result.page > 1 ? (
                <Link href={catalogHref(basePath, query, { page: result.page - 1 }, includeCategory)} className="btn-outline btn-sm rounded-full" rel="prev">
                  <ChevronLeft className="size-4" aria-hidden /> Previous
                </Link>
              ) : null}
              {pageNumbers(result.page, result.pageCount).map((p, i) =>
                p === null ? (
                  <span key={`gap-${i}`} className="px-1 text-muted">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={catalogHref(basePath, query, { page: p }, includeCategory)}
                    aria-current={p === result.page ? "page" : undefined}
                    className={
                      p === result.page
                        ? "flex size-9 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-navy-950 shadow-glow"
                        : "flex size-9 items-center justify-center rounded-full text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
                    }
                  >
                    {p}
                  </Link>
                ),
              )}
              {result.page < result.pageCount ? (
                <Link href={catalogHref(basePath, query, { page: result.page + 1 }, includeCategory)} className="btn-outline btn-sm rounded-full" rel="next">
                  Next <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
    </>
  );
}

function FiltersForm({ idPrefix, basePath, query, brands, categories }: { idPrefix: string; basePath: string; query: CatalogQuery; brands: string[]; categories?: CategoryDTO[] }) {
  return (
    <form action={basePath} method="get" className="space-y-6 border-t border-line p-5 lg:border-t-0">
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
      {query.sort !== "newest" ? <input type="hidden" name="sort" value={query.sort} /> : null}

      {categories ? (
        <div>
          <label htmlFor={`${idPrefix}-filter-category`} className="label">
            Category
          </label>
          <select id={`${idPrefix}-filter-category`} name="category" defaultValue={query.category ?? ""} className="input">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {brands.length ? (
        <fieldset>
          <legend className="label">Brand</legend>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {brands.map((b) => (
              <label key={b} className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-sm transition-colors hover:text-gold-700 dark:hover:text-gold-400">
                <input type="checkbox" name="brand" value={b} defaultChecked={query.brand.includes(b)} className="size-4 rounded accent-gold-500" />
                {b}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="label">Price (₦)</legend>
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-filter-min`} className="sr-only">
            Minimum price
          </label>
          <input id={`${idPrefix}-filter-min`} name="min" inputMode="numeric" placeholder="Min" defaultValue={koboToInputValue(query.min)} className="input" />
          <span className="text-muted">–</span>
          <label htmlFor={`${idPrefix}-filter-max`} className="sr-only">
            Maximum price
          </label>
          <input id={`${idPrefix}-filter-max`} name="max" inputMode="numeric" placeholder="Max" defaultValue={koboToInputValue(query.max)} className="input" />
        </div>
      </fieldset>

      <label className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-sm transition-colors hover:text-gold-700 dark:hover:text-gold-400">
        <input type="checkbox" name="inStock" value="1" defaultChecked={query.inStock} className="size-4 rounded accent-gold-500" />
        In stock only
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1">
          Apply
        </button>
        <Link href={query.q ? `${basePath}?q=${encodeURIComponent(query.q)}` : basePath} className="btn-outline">
          Reset
        </Link>
      </div>
    </form>
  );
}

/** Page numbers to show: first, last, and a window around the current page, with null for gaps. */
function pageNumbers(current: number, count: number): Array<number | null> {
  const pages = new Set([1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | null> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push(null);
    out.push(p);
  });
  return out;
}
