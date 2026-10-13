"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ShoppingBag, Trash2 } from "lucide-react";
import { formatNaira } from "@/lib/money";
import type { ValidatedCart, ValidatedCartLine } from "@/types/order";
import { useCart } from "./cart-context";
import { ProductImage } from "./product-image";
import { QuantityInput } from "./quantity-input";
import { useValidatedCart } from "./use-validated-cart";

const ISSUE_TEXT: Record<NonNullable<ValidatedCartLine["issue"]>, (l: ValidatedCartLine) => string> = {
  UNAVAILABLE: () => "No longer available — please remove it.",
  OUT_OF_STOCK: () => "Out of stock — please remove it.",
  QUANTITY_REDUCED: (l) => `Only ${l.available} available. Quantity adjusted.`,
};

export function CartView() {
  const { lines, ready, setQuantity, remove } = useCart();
  const { cart, error, loading } = useValidatedCart(lines, ready);

  // Drop lines the server no longer recognises (deleted products), and cap
  // quantities the server reduced, so the stored cart matches what's shown.
  useEffect(() => {
    if (!cart || loading) return;
    const known = new Set(cart.lines.map((l) => l.variantId));
    for (const l of lines) if (!known.has(l.variantId)) remove(l.variantId);
    for (const l of cart.lines) if (l.issue === "QUANTITY_REDUCED" && l.quantity > 0) setQuantity(l.variantId, l.quantity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, loading]);

  if (!ready || (loading && !cart && lines.length)) {
    return <div className="grid gap-8 lg:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Loading your cart"><div className="skeleton h-72 rounded-2xl" /><div className="skeleton h-56 rounded-2xl" /></div>;
  }

  if (!lines.length) {
    return (
      <div className="card mx-auto flex max-w-xl animate-fade-up flex-col items-center gap-4 px-6 py-20 text-center">
        <span className="mb-2 flex size-20 items-center justify-center rounded-full bg-gold-500/10 ring-1 ring-gold-500/25"><ShoppingBag className="size-9 text-gold-600" aria-hidden /></span>
        <p className="text-2xl font-bold">Your cart is empty</p>
        <p className="text-sm text-muted">Browse our products and add something you like.</p>
        <Link href="/shop" className="btn-gold mt-2 h-12 px-7">
          Start shopping
        </Link>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="card p-6 text-center">
        <p className="text-danger">{error}</p>
      </div>
    );
  }
  if (!cart) return null;

  const blocking = cart.lines.some((l) => l.issue === "UNAVAILABLE" || l.issue === "OUT_OF_STOCK");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="card divide-y divide-line overflow-hidden transition-opacity aria-busy:opacity-70" aria-busy={loading}>
        {cart.lines.map((l) => (
          <li key={l.variantId} className="flex animate-fade-up gap-4 p-4 transition-colors hover:bg-surface/40 sm:p-5">
            <Link href={`/product/${l.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-line sm:size-28">
              <ProductImage src={l.image} alt={l.name} sizes="96px" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/product/${l.slug}`} className="line-clamp-2 font-semibold transition-colors hover:text-gold-700 dark:hover:text-gold-400">
                    {l.name}
                  </Link>
                  {l.variantName ? <p className="text-sm text-muted">{l.variantName}</p> : null}
                  <p className="text-sm text-muted">{formatNaira(l.unitPriceKobo)} each</p>
                </div>
                <p className="shrink-0 font-bold tabular-nums">{formatNaira(l.lineTotalKobo)}</p>
              </div>
              {l.issue ? (
                <p className="flex items-center gap-1.5 text-sm text-warn">
                  <AlertTriangle className="size-4" aria-hidden /> {ISSUE_TEXT[l.issue](l)}
                </p>
              ) : null}
              <div className="mt-auto flex items-center justify-between gap-3">
                {l.available > 0 ? (
                  <QuantityInput value={Math.max(1, l.quantity)} max={l.available} onChange={(n) => setQuantity(l.variantId, n)} label={`Quantity of ${l.name}`} />
                ) : (
                  <span />
                )}
                <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => remove(l.variantId)}>
                  <Trash2 className="size-4" aria-hidden /> Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <OrderSummary cart={cart}>
        {blocking ? <p className="text-sm text-warn">Remove unavailable items to continue.</p> : null}
        <Link href="/checkout" className={`btn-gold h-12 w-full text-[15px] ${blocking ? "pointer-events-none opacity-50" : ""}`} aria-disabled={blocking}>
          Proceed to checkout
        </Link>
        <Link href="/shop" className="btn-ghost w-full">
          Continue shopping
        </Link>
      </OrderSummary>
    </div>
  );
}

export function OrderSummary({ cart, children }: { cart: ValidatedCart; children?: React.ReactNode }) {
  return (
    <aside className="card relative h-fit space-y-5 overflow-hidden p-6 lg:sticky lg:top-36" aria-label="Order summary">
      <div className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" aria-hidden />
      <h2 className="text-lg font-semibold">Order summary</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatNaira(cart.subtotalKobo)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Delivery</dt>
          <dd className="text-right">{cart.deliveryFeeKobo === null ? <span className="text-muted">Confirmed after order</span> : cart.deliveryFeeKobo === 0 ? "Free" : formatNaira(cart.deliveryFeeKobo)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-line pt-4 text-lg font-bold">
          <dt>Total</dt>
          <dd>{formatNaira(cart.totalKobo)}</dd>
        </div>
      </dl>
      {cart.deliveryFeeKobo === null ? <p className="text-xs text-muted">Delivery cost depends on your location. We&apos;ll confirm it with you before dispatch.</p> : null}
      {children}
    </aside>
  );
}
