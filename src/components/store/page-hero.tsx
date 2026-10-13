import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { href?: string; label: string };

/** Branded header band for inner pages: breadcrumbs, title and optional description. */
export function PageHero({ title, description, crumbs = [], eyebrow, children }: { title: string; description?: string | null; crumbs?: Crumb[]; eyebrow?: string; children?: React.ReactNode }) {
  const trail: Crumb[] = [{ href: "/", label: "Home" }, ...crumbs];
  return (
    <section className="relative isolate overflow-hidden bg-brand-gradient text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" aria-hidden />
      <div className="pointer-events-none absolute -top-24 right-10 -z-10 size-72 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
      <div className="container-page py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-4 animate-fade-in">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
            {trail.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="size-3 text-slate-600" aria-hidden /> : null}
                {c.href && i < trail.length - 1 ? (
                  <Link href={c.href} className="transition-colors hover:text-gold-300">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-slate-200" aria-current={i === trail.length - 1 ? "page" : undefined}>
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {eyebrow ? <p className="mb-2 animate-fade-up font-display text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">{eyebrow}</p> : null}
        <h1 className="animate-fade-up text-3xl font-bold tracking-tight [animation-delay:60ms] sm:text-4xl lg:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl animate-fade-up text-slate-300 [animation-delay:120ms]">{description}</p> : null}
        {children}
      </div>
    </section>
  );
}
