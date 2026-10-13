import "server-only";
import type { TxClient } from "../db";
import { db } from "../db";
import { Errors } from "../http";
import { audit } from "../audit";

/**
 * Inventory rules
 * ───────────────
 * • Stock is decremented (reserved) atomically when an order is placed, for
 *   every payment method. A conditional UPDATE … WHERE stock >= qty means two
 *   customers racing for the last unit cannot both succeed.
 * • Stock is restored exactly once when an order is cancelled
 *   (Order.inventoryRestored guards against double restoration).
 * • A CHECK (stock >= 0) constraint backs this up at the database level.
 * • Every change writes an InventoryMovement row for auditability.
 */

/** Atomically decrements stock; returns the new level, or null if insufficient. */
export async function decrementStock(tx: TxClient, variantId: string, quantity: number): Promise<number | null> {
  const rows = await tx.$queryRaw<{ stock: number }[]>`
    UPDATE "ProductVariant"
    SET "stock" = "stock" - ${quantity}, "updatedAt" = NOW()
    WHERE "id" = ${variantId} AND "isActive" = true AND "stock" >= ${quantity}
    RETURNING "stock"`;
  return rows.length ? Number(rows[0]!.stock) : null;
}

export async function incrementStock(tx: TxClient, variantId: string, quantity: number): Promise<number | null> {
  const rows = await tx.$queryRaw<{ stock: number }[]>`
    UPDATE "ProductVariant"
    SET "stock" = "stock" + ${quantity}, "updatedAt" = NOW()
    WHERE "id" = ${variantId}
    RETURNING "stock"`;
  return rows.length ? Number(rows[0]!.stock) : null;
}

/** Returns an order's reserved units to stock, once. Must run inside a transaction. */
export async function restoreOrderInventory(
  tx: TxClient,
  orderId: string,
  reason: "ORDER_CANCELLED" | "PAYMENT_FAILED",
  actorId: string | null,
): Promise<void> {
  // Claim the restoration atomically so concurrent cancellations cannot double-restore.
  const claimed = await tx.order.updateMany({ where: { id: orderId, inventoryRestored: false }, data: { inventoryRestored: true } });
  if (claimed.count === 0) return;
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
  for (const item of items) {
    if (!item.variantId) continue; // Variant deleted since purchase — nothing to restore.
    const stockAfter = await incrementStock(tx, item.variantId, item.quantity);
    if (stockAfter === null) continue;
    await tx.inventoryMovement.create({
      data: { variantId: item.variantId, change: item.quantity, stockAfter, reason, orderId, actorId },
    });
  }
}

/** Sets a variant's absolute stock level (admin adjustment). */
export async function setVariantStock(variantId: string, newStock: number, actorId: string, note: string | null): Promise<number> {
  if (!Number.isInteger(newStock) || newStock < 0) throw Errors.validation("Stock must be a whole number of zero or more");
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ stock: number }[]>`SELECT "stock" FROM "ProductVariant" WHERE "id" = ${variantId} FOR UPDATE`;
    if (!locked.length) throw Errors.notFound("Variant not found");
    const current = Number(locked[0]!.stock);
    if (current === newStock) return current;
    await tx.productVariant.update({ where: { id: variantId }, data: { stock: newStock } });
    await tx.inventoryMovement.create({
      data: { variantId, change: newStock - current, stockAfter: newStock, reason: "ADJUSTMENT", actorId, note },
    });
    await audit({ actorId, action: "inventory.adjust", entityType: "ProductVariant", entityId: variantId, details: { from: current, to: newStock, note } }, tx);
    return newStock;
  });
}
