/**
 * Order lifecycle rules shared by the server (enforcement) and the admin UI
 * (to only offer valid actions). Plain string unions keep this file free of
 * server-only imports.
 */

export type OrderStatusValue = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatusValue = "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethodValue = "PAY_ON_DELIVERY" | "BANK_TRANSFER" | "PAYSTACK";

export const ORDER_STATUSES: OrderStatusValue[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
export const PAYMENT_STATUSES: PaymentStatusValue[] = ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"];

/**
 * Forward-only fulfilment lifecycle:
 *   PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
 * Cancellation is allowed until the order has shipped. DELIVERED and
 * CANCELLED are terminal.
 */
const ORDER_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function allowedOrderTransitions(from: OrderStatusValue): OrderStatusValue[] {
  return ORDER_TRANSITIONS[from];
}

export function canTransitionOrder(from: OrderStatusValue, to: OrderStatusValue): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/**
 * Manual payment recording by an administrator.
 * - Offline methods (pay on delivery, bank transfer) can be marked PAID once
 *   money is received, or FAILED.
 * - Online (Paystack) payments are only ever marked PAID by server-side
 *   verification with the provider — never manually.
 * - Any PAID order can be recorded as REFUNDED (refunds happen out of band).
 */
export function allowedManualPaymentTransitions(
  method: PaymentMethodValue,
  from: PaymentStatusValue,
  orderStatus: OrderStatusValue,
): PaymentStatusValue[] {
  if (from === "PAID") return ["REFUNDED"];
  if (method === "PAYSTACK") return [];
  if (orderStatus === "CANCELLED") return [];
  if (from === "UNPAID" || from === "PENDING") return ["PAID", "FAILED"];
  if (from === "FAILED") return ["PAID"];
  return [];
}

export function canRecordPayment(
  method: PaymentMethodValue,
  from: PaymentStatusValue,
  to: PaymentStatusValue,
  orderStatus: OrderStatusValue,
): boolean {
  return allowedManualPaymentTransitions(method, from, orderStatus).includes(to);
}

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusValue, string> = {
  UNPAID: "Unpaid",
  PENDING: "Awaiting confirmation",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  PAY_ON_DELIVERY: "Pay on delivery",
  BANK_TRANSFER: "Bank transfer",
  PAYSTACK: "Online payment (Paystack)",
};

/** Maximum units of a single item per order line. */
export const MAX_QUANTITY_PER_LINE = 10;
/** Maximum distinct lines per order. */
export const MAX_LINES_PER_ORDER = 30;
/** Stock at or below this level is flagged as low in the admin dashboard. */
export const LOW_STOCK_THRESHOLD = 3;
