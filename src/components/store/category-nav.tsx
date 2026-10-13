"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Desktop category bar with an animated gold underline on the active and hovered item. */
export function CategoryNav({ categories }: { categories: { name: string; slug: string }[] }) {
  const pathname = usePathname();
  const items = [{ href: "/shop", label: "All products" }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name }))];

  return (
    <nav aria-label="Product categories" className="hidden border-t border-white/[0.06] lg:block">
      <ul className="container-page flex h-11 items-center gap-7 overflow-x-auto text-[13px] font-medium text-slate-300">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-3 transition-colors hover:text-white",
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-left after:rounded-full after:bg-gold-gradient after:transition-transform after:duration-300 hover:after:scale-x-100",
                  active ? "text-white after:scale-x-100" : "after:scale-x-0",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="ml-auto shrink-0">
          <Link href="/contact" className="text-gold-400 transition-colors hover:text-gold-300">
            Need help? Contact us →
          </Link>
        </li>
      </ul>
    </nav>
  );
}
