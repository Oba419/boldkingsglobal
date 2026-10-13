"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, Phone, Search, X } from "lucide-react";
import { telHref } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

export function MobileMenu({ categories, phone }: { categories: { name: string; slug: string }[]; phone: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const links = [
    ["/cart", "Cart"],
    ["/account", "My account"],
    ["/contact", "Contact us"],
    ["/delivery-returns", "Delivery & returns"],
    ["/about", "About us"],
  ] as const;

  return (
    <>
      <button type="button" className="flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-white/10 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && setOpen(false)}
        className="m-0 h-dvh max-h-dvh w-[88vw] max-w-sm bg-transparent p-0 text-ink open:animate-[slide-in_0.4s_var(--ease-out-expo)] backdrop:animate-fade-in"
        aria-label="Menu"
      >
        <div className="flex h-full flex-col bg-card">
          <div className="flex h-[72px] items-center justify-between bg-brand-gradient px-4">
            <Logo size="sm" />
            <button type="button" className="flex size-10 items-center justify-center rounded-xl text-white hover:bg-white/10" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </button>
          </div>
          <form action="/shop" method="get" role="search" className="relative border-b border-line p-4">
            <label htmlFor="mobile-search" className="sr-only">
              Search products
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="mobile-search" name="q" type="search" placeholder="Search products…" className="input rounded-full pl-10" />
          </form>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto">
            <p className="px-5 pt-5 pb-2 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">Shop</p>
            <ul>
              {[{ href: "/shop", name: "All products" }, ...categories.map((c) => ({ href: `/category/${c.slug}`, name: c.name }))].map((c, i) => (
                <li key={c.href} className={cn(open && "animate-fade-up")} style={{ animationDelay: `${60 + i * 35}ms` }}>
                  <Link
                    href={c.href}
                    className={cn("flex items-center justify-between px-5 py-3 text-[15px] font-medium transition-colors hover:bg-surface", pathname === c.href && "text-gold-700 dark:text-gold-400")}
                  >
                    {c.name}
                    <ChevronRight className="size-4 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="px-5 pt-6 pb-2 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">Help</p>
            <ul className="text-sm">
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="block px-5 py-3 transition-colors hover:bg-surface">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line p-4">
            <a href={telHref(phone)} className="btn-gold w-full">
              <Phone className="size-4" aria-hidden /> Call {phone}
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
