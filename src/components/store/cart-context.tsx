"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { api } from "@/lib/api-client";
import { MAX_LINES_PER_ORDER, MAX_QUANTITY_PER_LINE } from "@/lib/order-rules";

export type CartLine = { variantId: string; quantity: number };
export type ViewerSummary = { name: string; email: string; role: "CUSTOMER" | "ADMIN" } | null;

type CartContextValue = {
  lines: CartLine[];
  count: number;
  /** False until the saved cart has been read from storage — avoids flashing "empty cart". */
  ready: boolean;
  viewer: ViewerSummary;
  add: (variantId: string, quantity: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "bkg_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function sanitize(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const map = new Map<string, number>();
  for (const l of value) {
    if (!l || typeof l !== "object") continue;
    const { variantId, quantity } = l as Record<string, unknown>;
    if (typeof variantId !== "string" || variantId.length > 64 || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) continue;
    map.set(variantId, Math.min((map.get(variantId) ?? 0) + quantity, MAX_QUANTITY_PER_LINE));
  }
  return [...map.entries()].slice(0, MAX_LINES_PER_ORDER).map(([variantId, quantity]) => ({ variantId, quantity }));
}

function parse(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
}

// ─── localStorage-backed external store ──────────────────────────────────────
// An in-memory copy keeps the cart working when storage is blocked or full.

let cache: string | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): string {
  if (cache === null) {
    try {
      cache = localStorage.getItem(STORAGE_KEY) ?? "[]";
    } catch {
      cache = "[]";
    }
  }
  return cache;
}

/** Null on the server and during hydration, so `ready` starts false. */
function getServerSnapshot(): string | null {
  return null;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keep tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function writeCart(lines: CartLine[]) {
  cache = JSON.stringify(lines);
  try {
    localStorage.setItem(STORAGE_KEY, cache);
  } catch {
    // Storage unavailable — the in-memory copy still works for this visit.
  }
  for (const l of listeners) l();
}

/** Merges a guest cart with an account cart, keeping the larger quantity so repeated sign-ins never double up. */
function mergeCarts(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, number>();
  for (const l of [...a, ...b]) map.set(l.variantId, Math.max(map.get(l.variantId) ?? 0, l.quantity));
  return sanitize([...map.entries()].map(([variantId, quantity]) => ({ variantId, quantity })));
}

/**
 * The cart lives in localStorage so guests can shop without an account. For
 * signed-in customers it is also mirrored to the database (/api/cart), so it
 * follows them across devices. Prices are never stored here — the cart and
 * checkout always re-price from the server.
 */
export function CartProvider({ viewer, children }: { viewer: ViewerSummary; children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = raw !== null;
  const lines = useMemo(() => parse(raw), [raw]);
  const syncedFor = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountKey = viewer?.email ?? null;

  // On sign-in, merge the guest cart with the saved account cart once.
  useEffect(() => {
    if (!accountKey) {
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === accountKey) return;
    syncedFor.current = accountKey;
    let cancelled = false;
    api<{ items: CartLine[] }>("/api/cart")
      .then(async ({ items }) => {
        if (cancelled) return;
        const merged = mergeCarts(parse(getSnapshot()), items);
        writeCart(merged);
        await api("/api/cart", { method: "PUT", body: { items: merged } });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [accountKey]);

  const commit = useCallback(
    (updater: (prev: CartLine[]) => CartLine[]) => {
      const next = sanitize(updater(parse(getSnapshot())));
      writeCart(next);
      if (accountKey) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          api("/api/cart", { method: "PUT", body: { items: next } }).catch(() => undefined);
        }, 600);
      }
    },
    [accountKey],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      viewer,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      add: (variantId, quantity) =>
        commit((prev) => {
          const existing = prev.find((l) => l.variantId === variantId);
          return existing
            ? prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QUANTITY_PER_LINE) } : l))
            : [...prev, { variantId, quantity }];
        }),
      setQuantity: (variantId, quantity) =>
        commit((prev) =>
          quantity < 1 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
        ),
      remove: (variantId) => commit((prev) => prev.filter((l) => l.variantId !== variantId)),
      clear: () => commit(() => []),
    }),
    [lines, ready, viewer, commit],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
