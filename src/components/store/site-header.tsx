import Link from "next/link";
import { Phone, Search } from "lucide-react";
import { SITE } from "@/lib/site";
import { telHref } from "@/lib/phone";
import type { StoreSettingsDTO } from "@/types/settings";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CartButton, AccountLink } from "./header-actions";
import { MobileMenu } from "./mobile-menu";
import { Logo } from "./logo";
import { CategoryNav } from "./category-nav";

type NavCategory = { name: string; slug: string };

export function SiteHeader({ settings, categories }: { settings: StoreSettingsDTO; categories: NavCategory[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-navy-950/85 text-white backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-navy-950/70">
      {/* Thin gold line along the top edge. */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-500/70 to-transparent" aria-hidden />
      <div className="container-page flex h-[72px] items-center gap-3 lg:gap-8">
        <MobileMenu categories={categories} phone={settings.phonePrimary} />
        <Link href="/" className="shrink-0" aria-label={`${SITE.name} home`}>
          <Logo />
        </Link>

        <form action="/shop" method="get" role="search" className="group relative hidden max-w-xl flex-1 md:block">
          <label htmlFor="header-search" className="sr-only">
            Search products
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-gold-400" aria-hidden />
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder="Search phones, laptops, accessories…"
            className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] pr-24 pl-10 text-sm text-white transition-all placeholder:text-slate-400 hover:bg-white/[0.09] focus:border-gold-500/60 focus:bg-white/[0.1] focus:ring-4 focus:ring-gold-500/10 focus:outline-none"
          />
          <button type="submit" className="absolute top-1.5 right-1.5 h-8 rounded-full bg-gold-gradient px-4 text-xs font-semibold text-navy-950 transition-transform hover:scale-[1.03]">
            Search
          </button>
        </form>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <a href={telHref(settings.phonePrimary)} className="mr-2 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:text-white xl:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-gold-500/10 ring-1 ring-gold-500/30">
              <Phone className="size-3.5 text-gold-400" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] tracking-wider text-slate-400 uppercase">Call us</span>
              <span className="font-semibold text-white">{settings.phonePrimary}</span>
            </span>
          </a>
          <Link href="/shop" className="flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-white/10 md:hidden" aria-label="Search products">
            <Search className="size-5" />
          </Link>
          <ThemeToggle />
          <AccountLink />
          <CartButton />
        </div>
      </div>

      <CategoryNav categories={categories} />
    </header>
  );
}
