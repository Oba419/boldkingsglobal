"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { MAX_QUANTITY_PER_LINE } from "@/lib/order-rules";
import { cn } from "@/lib/utils";
import type { Kobo } from "@/lib/money";
import type { VariantDTO } from "@/types/catalog";
import { useCart } from "./cart-context";
import { Price } from "./price";
import { QuantityInput } from "./quantity-input";

export function PurchasePanel({ productName, variants, compareAtKobo }: { productName: string; variants: VariantDTO[]; compareAtKobo: Kobo | null }) {
  const router = useRouter();
  const { add, lines } = useCart();
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const variant = variants.find((v) => v.id === variantId);

  if (!variant) {
    return <p className="rounded-xl bg-warn-bg p-4 text-sm text-warn">This product is not available to order right now.</p>;
  }

  const inCart = lines.find((l) => l.variantId === variant.id)?.quantity ?? 0;
  const maxQty = Math.max(0, Math.min(variant.stock, MAX_QUANTITY_PER_LINE) - inCart);
  const inStock = variant.stock > 0;
  const showVariants = variants.length > 1 || variant.name !== "Standard";

  function addToCart(goToCheckout: boolean) {
    if (!variant || quantity < 1 || quantity > maxQty) return;
    add(variant.id, quantity);
    if (goToCheckout) {
      router.push("/checkout");
    } else {
      toast.success("Added to cart", {
        description: `${quantity} × ${productName}${showVariants ? ` (${variant.name})` : ""}`,
        action: { label: "View cart", onClick: () => router.push("/cart") },
      });
      setQuantity(1);
    }
  }

  return (
    <div className="space-y-5">
      <Price kobo={variant.priceKobo} compareAtKobo={compareAtKobo} size="lg" />

      {showVariants ? (
        <fieldset>
          <legend className="label">Option</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center rounded-xl border px-4 text-sm font-medium transition-all duration-200 active:scale-95 has-focus-visible:ring-2 has-focus-visible:ring-gold-500",
                  v.id === variantId ? "border-gold-500 bg-gold-500/10 text-ink ring-2 ring-gold-500/25" : "border-line bg-card hover:border-gold-500/60",
                  v.stock <= 0 && "text-muted line-through decoration-1",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={v.id === variantId}
                  onChange={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                  }}
                  className="sr-only"
                />
                {v.name}
                {v.stock <= 0 ? <span className="sr-only"> (out of stock)</span> : null}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <p className={cn("flex items-center gap-2 text-sm font-medium", inStock ? (variant.stock <= 3 ? "text-warn" : "text-success") : "text-danger")} aria-live="polite">
        <span className="relative flex size-2.5" aria-hidden>
          {inStock ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-50" /> : null}
          <span className="relative inline-flex size-2.5 rounded-full bg-current" />
        </span>
        {inStock ? (variant.stock <= 3 ? `Only ${variant.stock} left in stock` : "In stock") : "Out of stock"}
        {inCart > 0 ? <span className="ml-2 font-normal text-muted">· {inCart} in your cart</span> : null}
      </p>

      {inStock ? (
        maxQty > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <QuantityInput value={quantity} max={maxQty} onChange={setQuantity} label={`Quantity of ${productName}`} />
            <button type="button" className="btn-primary h-12 flex-1" onClick={() => addToCart(false)}>
              <ShoppingBag className="size-4" aria-hidden /> Add to cart
            </button>
            <button type="button" className="btn-gold h-12 flex-1" onClick={() => addToCart(true)}>
              <Zap className="size-4" aria-hidden /> Buy now
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">You already have the maximum available quantity in your cart.</p>
        )
      ) : (
        <p className="text-sm text-muted">Call or WhatsApp us to ask when this will be back in stock.</p>
      )}

      <p className="border-t border-line pt-4 text-xs text-muted">SKU <span className="font-mono">{variant.sku}</span></p>
    </div>
  );
}
