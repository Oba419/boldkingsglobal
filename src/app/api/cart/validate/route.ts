import { z } from "zod";
import { ok, readJson, route } from "@/server/http";
import { validateCart } from "@/server/services/cart";
import { cartLineInputSchema } from "@/schemas/checkout";

export const dynamic = "force-dynamic";

// Quantities above the per-line maximum are accepted here and clamped by
// validateCart, so the cart UI can explain the adjustment.
const bodySchema = z.object({
  items: z.array(cartLineInputSchema.extend({ quantity: z.number().int().min(1).max(1000) })).max(50),
});

/** POST /api/cart/validate — authoritative prices, stock and totals for a cart. */
export const POST = route(async (req) => {
  const { items } = bodySchema.parse(await readJson(req));
  return ok(await validateCart(items));
});
