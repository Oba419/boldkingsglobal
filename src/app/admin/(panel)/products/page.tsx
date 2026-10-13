import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { listProductsAdmin } from "@/server/services/admin-products";
import { formatNaira } from "@/lib/money";
import { LOW_STOCK_THRESHOLD } from "@/lib/order-rules";
import { EmptyRow, PageHeader, Pager, Panel, qs } from "@/components/admin/ui";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export const metadata: Metadata = { title: "Products" };

const FILTERS = [
  { value: "", label: "All (not archived)" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Hidden" },
  { value: "low-stock", label: `Low stock (≤ ${LOW_STOCK_THRESHOLD})` },
  { value: "archived", label: "Archived" },
];

type Props = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listProductsAdmin({ q: sp.q, status: sp.status, page });

  return (
    <>
      <PageHeader
        title="Products"
        description={`${data.total} product${data.total === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/products/new" className="btn-primary">
            <Plus className="size-4" aria-hidden /> Add product
          </Link>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="products-q" className="sr-only">
          Search products
        </label>
        <input id="products-q" name="q" defaultValue={sp.q} placeholder="Name, brand or SKU" className="input max-w-xs" />
        <label htmlFor="products-status" className="sr-only">
          Filter
        </label>
        <select id="products-status" name="status" defaultValue={sp.status ?? ""} className="input w-auto">
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {sp.q || sp.status ? (
          <Link href="/admin/products" className="btn-ghost">
            Clear
          </Link>
        ) : null}
      </form>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-surface/70 text-left text-[11px] tracking-wider text-muted uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Price</th>
                <th className="px-4 py-2.5 font-medium">Stock</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.products.length ? (
                data.products.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface/60">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-card">
                          {p.image ? <Image src={p.image} alt="" fill sizes="40px" className="object-contain" /> : null}
                        </span>
                        <span className="min-w-0">
                          <Link href={`/admin/products/${p.id}`} className="block truncate font-medium hover:underline">
                            {p.name}
                          </Link>
                          <span className="text-xs text-muted">
                            {p.brand} · {p.variantCount} variant{p.variantCount === 1 ? "" : "s"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{p.category}</td>
                    <td className="px-4 py-2.5">{formatNaira(p.priceKobo)}</td>
                    <td className="px-4 py-2.5">
                      <span className={p.stock === 0 ? "font-semibold text-danger" : p.stock <= LOW_STOCK_THRESHOLD ? "font-semibold text-warn" : ""}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {p.archived ? (
                          <Tag>Archived</Tag>
                        ) : p.isActive ? (
                          <Tag tone="success">Active</Tag>
                        ) : (
                          <Tag>Hidden</Tag>
                        )}
                        {p.isFeatured ? <Tag tone="gold">Featured</Tag> : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ProductRowActions id={p.id} slug={p.slug} archived={p.archived} visible={p.isActive && !p.archived} />
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={6}>No products match.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      <Pager page={data.page} pageCount={data.pageCount} href={(p) => `/admin/products${qs({ q: sp.q, status: sp.status, page: p })}`} />
    </>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "success" | "gold" }) {
  const cls = tone === "success" ? "bg-success-bg text-success" : tone === "gold" ? "bg-gold-500/15 text-gold-800 dark:text-gold-300" : "bg-surface text-muted";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}
