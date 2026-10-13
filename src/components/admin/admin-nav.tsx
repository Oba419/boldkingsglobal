"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, FolderTree, Inbox, LayoutDashboard, Menu, Package, Settings, ShoppingCart, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/store/logo";
import { LogoutButton } from "@/components/auth-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/account", label: "My account", icon: UserRound },
];

export function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-navy-950/90 px-4 text-white backdrop-blur-xl lg:hidden">
        <Link href="/admin" aria-label="Admin dashboard">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button type="button" className="flex size-10 items-center justify-center rounded-xl hover:bg-white/10" aria-expanded={open} aria-controls="admin-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <aside
        id="admin-nav"
        className={cn("relative isolate flex-col overflow-hidden bg-brand-gradient text-slate-300 lg:sticky lg:top-0 lg:flex lg:h-dvh", open ? "flex animate-fade-in" : "hidden")}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-50" aria-hidden />
        <div className="hidden h-20 items-center justify-between px-5 lg:flex">
          <Link href="/admin" aria-label="Admin dashboard">
            <Logo size="sm" />
          </Link>
        </div>
        <p className="px-6 pt-2 pb-3 text-[10px] font-semibold tracking-[0.25em] text-slate-500 uppercase">Manage</p>
        <nav aria-label="Admin" className="flex-1 px-3">
          <ul className="space-y-1">
            {LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                      active ? "bg-gradient-to-r from-gold-500/20 to-gold-500/[0.03] text-white ring-1 ring-gold-500/25" : "hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    {active ? <span className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-gold-gradient" aria-hidden /> : null}
                    <Icon className={cn("size-[18px] transition-transform duration-200 group-hover:scale-110", active ? "text-gold-400" : "text-slate-400")} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-3 border-t border-white/[0.08] p-4 text-sm">
          <div className="flex items-center justify-between">
            <Link href="/" target="_blank" className="flex items-center gap-2 transition-colors hover:text-white">
              <ExternalLink className="size-4" aria-hidden /> View store
            </Link>
            <ThemeToggle className="hidden text-white lg:flex" />
          </div>
          <Link href="/admin/account" className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 transition-colors hover:bg-white/[0.1]">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-navy-950">{adminName.charAt(0).toUpperCase()}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{adminName}</span>
              <span className="block text-xs text-slate-500">Administrator</span>
            </span>
          </Link>
          <LogoutButton className="btn-outline-light btn-sm w-full" redirectTo="/admin/login" />
        </div>
      </aside>
    </>
  );
}
