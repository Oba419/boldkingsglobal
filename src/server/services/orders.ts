import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "../db";
import { appUrl, getServerEnv } from "../env";
import { ApiError, Errors, isUniqueConstraintError } from "../http";
import { audit } from "../audit";
import { getPaymentProvider } from "../payments";
import { decrementStock } from "./inventory";
import { loadSettings } from "./settings";
import { decimalToKobo, koboToDecimalString, multiplyKobo, sumKobo } from "@/lib/money";
import { MAX_QUANTITY_PER_LINE } from "@/lib/order-rules";
import { toLocalNigerian } from "@/lib/phone";
import type { CreateOrderInput } from "@/schemas/checkout";
import type { CreateOrderResult, OrderDTO } from "@/types/order";
import type { SessionUser } from "../auth/session";

// ─── References & access tokens ──────────────────────────────────────────────

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L ambiguity

/** Random, non-sequential public order reference, e.g. "BKG-7KQ2M9XA". */
export function generateOrderReference(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `BKG-${s}`;
}

/**
 * Guest order-access token: HMAC(SESSION_SECRET, order id + random salt).
 * Not stored anywhere, so a database leak alone does not reveal tokens, and
 * the same token can be re-derived for idempotent replays.
 */
export function orderAccessToken(order: { id: string; accessSalt: string }): string {
  return createHmac("sha256", getServerEnv().SESSION_SECRET).update(`order-access:${order.id}:${order.accessSalt}`).digest("base64url");
}

export function verifyOrderAccessToken(order: { id: string; accessSalt: string }, token: string | null | undefined): boolean {
  if (!token || token.length > 100) return false;
  const expected = Buffer.from(orderAccessToken(order));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// ─── DTO mapping ─────────────────────────────────────────────────────────────

type OrderWithItems = NonNullable<Awaited<ReturnType<typeof findOrderWithItems>>>;

function findOrderWithItems(where: { reference: string } | { id: string }) {
  return db.order.findUnique({ where, include: { items: { orderBy: { id: "asc" } } } });
}

export function toOrderDTO(o: OrderWithItems): OrderDTO {
  return {
    id: o.id,
    reference: o.reference,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    deliveryState: o.deliveryState,
    deliveryCity: o.deliveryCity,
    deliveryAddress: o.deliveryAddress,
    deliveryInstructions: o.deliveryInstructions,
    subtotalKobo: decimalToKobo(o.subtotal),
    deliveryFeeKobo: o.deliveryFee ? decimalToKobo(o.deliveryFee) : null,
    totalKobo: decimalToKobo(o.total),
    currency: o.currency,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      productSlug: i.productSlug,
      variantName: i.variantName,
      sku: i.sku,
      image: i.image,
      unitPriceKobo: decimalToKobo(i.unitPrice),
      quantity: i.quantity,
      lineTotalKobo: decimalToKobo(i.lineTotal),
    })),
  };
}

// ─── Order creation ──────────────────────────────────────────────────────────

function mergeOrderLines(items: CreateOrderInput["items"]) {
  const map = new Map<string, number>();
  for (const i of items) map.set(i.variantId, (map.get(i.variantId) ?? 0) + i.quantity);
  const lines = [...map.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
  for (const l of lines) {
    if (l.quantity > MAX_QUANTITY_PER_LINE) {
      throw Errors.validation(`You can order at most ${MAX_QUANTITY_PER_LINE} of an item at once`);
    }
  }
  // Deterministic lock order prevents deadlocks between concurrent checkouts.
  return lines.sort((a, b) => a.variantId.localeCompare(b.variantId));
}

async function replayOrder(order: { id: string; reference: string; accessSalt: string; total: { toFixed(dp: number): string }; paymentMethod: string; paymentStatus: string }): Promise<CreateOrderResult> {
  let paymentRedirectUrl: string | null = null;
  if (order.paymentMethod === "PAYSTACK" && order.paymentStatus !== "PAID") {
    const tx = await db.paymentTransaction.findFirst({ where: { orderId: order.id, status: "PENDING" }, orderBy: { createdAt: "desc" } });
    paymentRedirectUrl = tx?.authorizationUrl ?? null;
  }
  return {
    reference: order.reference,
    accessToken: orderAccessToken(order),
    totalKobo: decimalToKobo(order.total),
    paymentRedirectUrl,
    paymentError: null,
    replayed: true,
  };
}

/**
 * Creates an order. All prices, stock and totals come from the database —
 * the request carries only variant IDs and quantities. Order + items +
 * inventory reservation commit in a single transaction, and the client's
 * idempotency key makes retries safe (a repeated submission returns the
 * original order instead of creating a duplicate).
 */
export async function createOrder(input: CreateOrderInput, opts: { userId: string | null }): Promise<CreateOrderResult> {
  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return replayOrder(existing);

  const settings = await loadSettings();
  const method = input.paymentMethod;
  if (method === "PAY_ON_DELIVERY" && !settings.payOnDeliveryEnabled) {
    throw new ApiError(400, "PAYMENT_UNAVAILABLE", "Pay on delivery is not currently available.");
  }
  if (method === "BANK_TRANSFER" && !settings.bankTransferEnabled) {
    throw new ApiError(400, "PAYMENT_UNAVAILABLE", "Bank transfer is not currently available.");
  }
  if (method === "PAYSTACK") {
    if (!getPaymentProvider()) throw new ApiError(400, "PAYMENT_UNAVAILABLE", "Online payment is not configured for this store yet.");
    if (!input.email) throw Errors.validation("An email address is required for online payment", { email: ["Required for online payment"] });
  }

  const lines = mergeOrderLines(input.items);
  const phone = toLocalNigerian(input.phone) ?? input.phone;

  let order: { id: string; reference: string; accessSalt: string; total: { toFixed(dp: number): string } } | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await db.$transaction(
        async (tx) => {
          const variants = await tx.productVariant.findMany({
            where: { id: { in: lines.map((l) => l.variantId) } },
            include: { product: { include: { category: { select: { isActive: true, image: true } } } } },
          });
          const byId = new Map(variants.map((v) => [v.id, v]));

          const items: Array<{
            productId: string; variantId: string; productName: string; productSlug: string; sku: string;
            variantName: string | null; image: string | null; unitPrice: string; quantity: number; lineTotal: string; lineKobo: number;
          }> = [];
          const movements: Array<{ variantId: string; change: number; stockAfter: number }> = [];

          for (const line of lines) {
            const v = byId.get(line.variantId);
            const purchasable = v && v.isActive && v.product.isActive && !v.product.archivedAt && v.product.category.isActive;
            if (!v || !purchasable) {
              throw Errors.insufficientStock(`${v ? `"${v.product.name}"` : "An item in your cart"} is no longer available. Please update your cart.`, {
                variantId: line.variantId,
                available: 0,
              });
            }
            const stockAfter = await decrementStock(tx, v.id, line.quantity);
            if (stockAfter === null) {
              const fresh = await tx.productVariant.findUnique({ where: { id: v.id }, select: { stock: true } });
              const available = fresh?.stock ?? 0;
              throw Errors.insufficientStock(
                available > 0
                  ? `Only ${available} unit${available === 1 ? "" : "s"} of "${v.product.name}" ${available === 1 ? "is" : "are"} left in stock.`
                  : `"${v.product.name}" is out of stock.`,
                { variantId: v.id, available },
              );
            }
            const unit = v.priceOverride ? decimalToKobo(v.priceOverride) : decimalToKobo(v.product.price);
            const lineKobo = multiplyKobo(unit, line.quantity);
            items.push({
              productId: v.productId,
              variantId: v.id,
              productName: v.product.name,
              productSlug: v.product.slug,
              sku: v.sku,
              variantName: v.name === "Standard" ? null : v.name,
              image: v.product.images[0] ?? v.product.category.image ?? null,
              unitPrice: koboToDecimalString(unit),
              quantity: line.quantity,
              lineTotal: koboToDecimalString(lineKobo),
              lineKobo,
            });
            movements.push({ variantId: v.id, change: -line.quantity, stockAfter });
          }

          const subtotal = sumKobo(items.map((i) => i.lineKobo));
          const deliveryFee = settings.deliveryFeeKobo;
          const total = subtotal + (deliveryFee ?? 0);

          const created = await tx.order.create({
            data: {
              reference: generateOrderReference(),
              accessSalt: randomBytes(16).toString("base64url"),
              idempotencyKey: input.idempotencyKey,
              userId: opts.userId,
              customerName: input.fullName,
              customerPhone: phone,
              customerEmail: input.email ?? null,
              deliveryState: input.state,
              deliveryCity: input.city,
              deliveryAddress: input.address,
              deliveryInstructions: input.instructions ?? null,
              subtotal: koboToDecimalString(subtotal),
              deliveryFee: deliveryFee === null ? null : koboToDecimalString(deliveryFee),
              total: koboToDecimalString(total),
              currency: settings.currency,
              paymentMethod: method,
              paymentStatus: method === "PAYSTACK" ? "PENDING" : "UNPAID",
              items: { create: items.map(({ lineKobo: _lineKobo, ...rest }) => rest) },
            },
          });
          await tx.inventoryMovement.createMany({
            data: movements.map((m) => ({ ...m, reason: "ORDER_PLACED" as const, orderId: created.id, actorId: opts.userId })),
          });
          await audit(
            { actorId: opts.userId, action: "order.create", entityType: "Order", entityId: created.id, details: { reference: created.reference, total: koboToDecimalString(total) } },
            tx,
          );
          return created;
        },
        { timeout: 20_000 },
      );
    } catch (err) {
      if (!isUniqueConstraintError(err)) throw err;
      // Either a concurrent duplicate submission (same idempotency key) or a
      // rare reference collision. The former returns the original order.
      const dup = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (dup) return replayOrder(dup);
    }
  }
  if (!order) throw new Error("Could not allocate a unique order reference");

  const result: CreateOrderResult = {
    reference: order.reference,
    accessToken: orderAccessToken(order),
    totalKobo: decimalToKobo(order.total),
    paymentRedirectUrl: null,
    paymentError: null,
    replayed: false,
  };

  if (method === "PAYSTACK") {
    const payment = await startOnlinePayment(order.id);
    result.paymentRedirectUrl = payment.authorizationUrl;
    result.paymentError = payment.error;
  }
  return result;
}

// ─── Online payments ─────────────────────────────────────────────────────────

/** Initialises a provider transaction for an unpaid online-payment order. */
export async function startOnlinePayment(orderId: string): Promise<{ authorizationUrl: string | null; error: string | null }> {
  const provider = getPaymentProvider();
  if (!provider) return { authorizationUrl: null, error: "Online payment is not configured." };
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw Errors.notFound("Order not found");
  if (order.paymentMethod !== "PAYSTACK") throw Errors.badRequest("This order does not use online payment");
  if (order.paymentStatus === "PAID") return { authorizationUrl: null, error: "This order has already been paid." };
  if (order.status === "CANCELLED") return { authorizationUrl: null, error: "This order has been cancelled." };
  if (!order.customerEmail) return { authorizationUrl: null, error: "An email address is required for online payment." };

  const reference = `${order.reference}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const transaction = await db.paymentTransaction.create({
    data: { orderId: order.id, provider: provider.id, reference, amount: order.total, currency: order.currency, status: "PENDING" },
  });
  try {
    const token = orderAccessToken(order);
    const callbackUrl = appUrl(`/api/payments/paystack/callback?order=${encodeURIComponent(order.reference)}&token=${encodeURIComponent(token)}`);
    const { authorizationUrl } = await provider.initialize({
      reference,
      amountKobo: decimalToKobo(order.total),
      email: order.customerEmail,
      callbackUrl,
      metadata: { orderReference: order.reference },
    });
    await db.$transaction([
      db.paymentTransaction.update({ where: { id: transaction.id }, data: { authorizationUrl } }),
      db.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING" } }),
    ]);
    return { authorizationUrl, error: null };
  } catch (err) {
    console.error("[payments] initialise failed", err);
    await db.paymentTransaction.update({ where: { id: transaction.id }, data: { status: "FAILED", providerResponse: { error: "initialize_failed" } } });
    return { authorizationUrl: null, error: "We couldn't start the online payment. Your order is saved — please try paying again shortly or contact us." };
  }
}

/**
 * Verifies a transaction with the provider (server-to-server) and records the
 * result. Idempotent: safe to call from both the browser callback and the
 * webhook, any number of times. Never trusts the browser's redirect alone.
 */
export async function confirmOnlinePayment(txReference: string): Promise<{ orderReference: string; outcome: "paid" | "failed" | "pending" | "mismatch" }> {
  const provider = getPaymentProvider();
  if (!provider) throw new ApiError(400, "PAYMENT_UNAVAILABLE", "Online payment is not configured.");
  const transaction = await db.paymentTransaction.findUnique({ where: { reference: txReference }, include: { order: true } });
  if (!transaction) throw Errors.notFound("Payment transaction not found");
  if (transaction.status === "SUCCESS") return { orderReference: transaction.order.reference, outcome: "paid" };

  const result = await provider.verify(txReference);
  const expected = decimalToKobo(transaction.amount);

  if (result.status === "success") {
    if (result.amountKobo !== expected || result.currency !== transaction.currency) {
      await db.$transaction(async (tx) => {
        await tx.paymentTransaction.update({ where: { id: transaction.id }, data: { status: "FAILED", providerResponse: { mismatch: true, received: result.amountKobo, currency: result.currency } } });
        await audit({ action: "payment.amount_mismatch", entityType: "Order", entityId: transaction.orderId, details: { txReference, expected, received: result.amountKobo } }, tx);
      });
      return { orderReference: transaction.order.reference, outcome: "mismatch" };
    }
    await db.$transaction(async (tx) => {
      const claimed = await tx.paymentTransaction.updateMany({
        where: { id: transaction.id, status: { not: "SUCCESS" } },
        data: { status: "SUCCESS", providerResponse: result.raw as object },
      });
      if (claimed.count === 0) return;
      await tx.order.update({ where: { id: transaction.orderId }, data: { paymentStatus: "PAID" } });
      await audit(
        {
          action: transaction.order.status === "CANCELLED" ? "payment.received_for_cancelled_order" : "payment.paid",
          entityType: "Order",
          entityId: transaction.orderId,
          details: { txReference, amount: koboToDecimalString(expected), provider: provider.id },
        },
        tx,
      );
    });
    return { orderReference: transaction.order.reference, outcome: "paid" };
  }

  if (result.status === "failed" || result.status === "abandoned") {
    await db.$transaction(async (tx) => {
      await tx.paymentTransaction.updateMany({
        where: { id: transaction.id, status: "PENDING" },
        data: { status: result.status === "failed" ? "FAILED" : "ABANDONED", providerResponse: result.raw as object },
      });
      await tx.order.updateMany({ where: { id: transaction.orderId, paymentStatus: { not: "PAID" } }, data: { paymentStatus: "FAILED" } });
      await audit({ action: "payment.failed", entityType: "Order", entityId: transaction.orderId, details: { txReference, status: result.status } }, tx);
    });
    return { orderReference: transaction.order.reference, outcome: "failed" };
  }
  return { orderReference: transaction.order.reference, outcome: "pending" };
}

// ─── Reading orders ──────────────────────────────────────────────────────────

/**
 * Returns an order only to an authorised viewer: an admin, the signed-in
 * customer who placed it, or someone holding the order's access token.
 * Unauthorised and missing orders are indistinguishable (both null).
 */
export async function getOrderForViewer(reference: string, token: string | null | undefined, viewer: SessionUser | null): Promise<OrderDTO | null> {
  if (!/^BKG-[A-Z0-9]{8}$/.test(reference)) return null;
  const order = await findOrderWithItems({ reference });
  if (!order) return null;
  const authorised =
    viewer?.role === "ADMIN" || (viewer !== null && order.userId !== null && order.userId === viewer.id) || verifyOrderAccessToken(order, token);
  return authorised ? toOrderDTO(order) : null;
}

/** Internal lookup for flows that have already authorised the caller. */
export async function getOrderRecordByReference(reference: string) {
  return db.order.findUnique({ where: { reference } });
}

export async function listUserOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { items: true } } },
  });
  return orders.map((o) => ({
    reference: o.reference,
    status: o.status,
    paymentStatus: o.paymentStatus,
    totalKobo: decimalToKobo(o.total),
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  }));
}
