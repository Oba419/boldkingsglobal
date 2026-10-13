import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex animate-fade-up flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("card animate-fade-up overflow-hidden", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2.5 font-semibold"><span className="h-4 w-1 rounded-full bg-gold-gradient" aria-hidden />{title}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Pager({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-end gap-2 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-outline btn-sm">
          Previous
        </Link>
      ) : null}
      <span className="px-2 text-muted">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="btn-outline btn-sm">
          Next
        </Link>
      ) : null}
    </nav>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-muted">
        {children}
      </td>
    </tr>
  );
}

/** Builds a query string from defined, non-empty values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "" && !(k === "page" && v === 1)) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
