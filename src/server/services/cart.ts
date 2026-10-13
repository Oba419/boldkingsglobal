import "server-only";
import { db } from "../db";
import { decimalToKobo, multiplyKobo, sumKobo } from "@/lib/money";
import { MAX_QUANTITY_PER_LINE } from "@/lib/order-rules";
import type { CartLineInput } from "@/schemas/checkout";
import type { ValidatedCart, ValidatedCartLine } from "@/types/order";
import { getSettings } from "./settings";

/** Merges duplicate variant lines, capping each at the per-line maximum. */
export function mergeCartLines(lines: CartLineInput[]): CartLineInput[] {
  const map = new Map<string, number>();
  for (const l of lines) map.set(l.variantId, (map.get(l.variantId) ?? 0) + l.quantity);
  return [...map.entries()].map(([variantId, quantity]) => ({ variantId, quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE) }));
}

/**
 * Re-prices a cart from the database. The browser's copy of prices is
 * display-only; this is the authoritative view used by the cart and checkout.
 */
export async function validateCart(input: CartLineInput[]): Promise<ValidatedCart> {
  const lines = mergeCartLines(input);
  const variants = await db.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    include: { product: { include: { category: { select: { isActive: true, image: true } } } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const result: ValidatedCartLine[] = [];
  for (const line of lines) {
    const v = byId.get(line.variantId);
    if (!v) continue; // Unknown variant (deleted) — silently dropped from the cart.
    const purchasable = v.isActive && v.product.isActive && !v.product.archivedAt && v.product.category.isActive;
    const unit = v.priceOverride ? decimalToKobo(v.priceOverride) : decimalToKobo(v.product.price);
    const available = purchasable ? Math.min(v.stock, MAX_QUANTITY_PER_LINE) : 0;
    const quantity = Math.min(line.quantity, available);
    let issue: ValidatedCartLine["issue"] = null;
    if (!purchasable) issue = "UNAVAILABLE";
    else if (v.stock <= 0) issue = "OUT_OF_STOCK";
    else if (quantity < line.quantity) issue = "QUANTITY_REDUCED";
    result.push({
      variantId: v.id,
      productId: v.productId,
      slug: v.product.slug,
      name: v.product.name,
      brand: v.product.brand,
      variantName: v.name === "Standard" ? null : v.name,
      image: v.product.images[0] ?? v.product.category.image ?? null,
      unitPriceKobo: unit,
      requestedQuantity: line.quantity,
      quantity,
      available,
      lineTotalKobo: multiplyKobo(unit, quantity),
      issue,
    });
  }

  const settings = await getSettings();
  const subtotal = sumKobo(result.map((l) => l.lineTotalKobo));
  const deliveryFee = settings.deliveryFeeKobo;
  return {
    lines: result,
    subtotalKobo: subtotal,
    deliveryFeeKobo: deliveryFee,
    totalKobo: subtotal + (deliveryFee ?? 0),
    hasIssues: result.some((l) => l.issue !== null),
  };
}

/** Saved cart for a signed-in customer. */
export async function getUserCart(userId: string): Promise<CartLineInput[]> {
  const items = await db.cartItem.findMany({ where: { userId }, orderBy: { updatedAt: "asc" } });
  return items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
}

/** Replaces a signed-in customer's saved cart. Unknown variants are ignored. */
export async function replaceUserCart(userId: string, lines: CartLineInput[]): Promise<CartLineInput[]> {
  const merged = mergeCartLines(lines);
  const existing = await db.productVariant.findMany({ where: { id: { in: merged.map((l) => l.variantId) } }, select: { id: true } });
  const valid = new Set(existing.map((v) => v.id));
  const keep = merged.filter((l) => valid.has(l.variantId));
  await db.$transaction([
    db.cartItem.deleteMany({ where: { userId } }),
    db.cartItem.createMany({ data: keep.map((l) => ({ userId, variantId: l.variantId, quantity: l.quantity })) }),
  ]);
  return keep;
}
