"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api-client";
import type { ValidatedCart } from "@/types/order";
import type { CartLine } from "./cart-context";

type Result = { key: string; cart: ValidatedCart | null; error: string | null };

/** Re-prices the cart on the server whenever its lines change. */
export function useValidatedCart(lines: CartLine[], ready: boolean) {
  const [result, setResult] = useState<Result | null>(null);
  const key = JSON.stringify(lines);
  const empty = lines.length === 0;

  useEffect(() => {
    if (!ready || empty) return;
    let cancelled = false;
    api<ValidatedCart>("/api/cart/validate", { body: { items: JSON.parse(key) } })
      .then((cart) => !cancelled && setResult({ key, cart, error: null }))
      // Keep showing the last good totals alongside the error.
      .catch((err) => !cancelled && setResult((prev) => ({ key, cart: prev?.cart ?? null, error: errorMessage(err) })));
    return () => {
      cancelled = true;
    };
  }, [key, ready, empty]);

  if (empty) return { cart: null, error: null, loading: false };
  return {
    cart: result?.cart ?? null,
    error: result?.key === key ? result.error : null,
    loading: !ready || result?.key !== key,
  };
}
