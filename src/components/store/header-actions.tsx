"use client";

import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "./cart-context";

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/cart"
      className="group relative flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-white/10"
      aria-label={ready && count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
    >
      <ShoppingBag className="size-5 transition-transform duration-300 group-hover:-rotate-6" aria-hidden />
      {ready && count > 0 ? (
        // Keyed on count so the badge pops each time an item is added.
        <span
          key={count}
          className="absolute -top-0.5 -right-0.5 flex min-w-5 animate-pop items-center justify-center rounded-full bg-gold-gradient px-1 text-[11px] leading-5 font-bold text-navy-950 shadow-[0_2px_10px_rgb(214_168_79/0.6)]"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

export function AccountLink() {
  const { viewer } = useCart();
  const href = viewer?.role === "ADMIN" ? "/admin" : viewer ? "/account" : "/account/login";
  const label = viewer ? `Account: ${viewer.name}` : "Sign in";
  return (
    <Link href={href} className="flex h-10 items-center gap-2 rounded-xl px-2.5 transition-colors hover:bg-white/10" aria-label={label}>
      {viewer ? (
        <span className="flex size-7 items-center justify-center rounded-full bg-gold-gradient text-xs font-bold text-navy-950" aria-hidden>
          {viewer.name.charAt(0).toUpperCase()}
        </span>
      ) : (
        <User className="size-5" aria-hidden />
      )}
      <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">{viewer ? viewer.name.split(" ")[0] : "Sign in"}</span>
    </Link>
  );
}
