import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { getOrderAdmin } from "@/server/services/admin-orders";
import { formatNaira } from "@/lib/money";
import {
  allowedManualPaymentTransitions,
  allowedOrderTransitions,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-rules";
import { telHref, whatsappHref } from "@/lib/phone";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Panel } from "@/components/admin/ui";
import { OrderNoteForm, OrderPaymentActions, OrderStatusActions } from "@/components/admin/order-actions";

export const metadata: Metadata = { title: "Order" };

const HISTORY_LABELS: Record<string, string> = {
  "order.create": "Order placed",
  "order.status": "Status changed",
  "order.payment": "Payment recorded",
  "payment.paid": "Online payment confirmed",
  "payment.failed": "Online payment failed",
  "payment.amount_mismatch": "Payment amount mismatch",
  "payment.received_for_cancelled_order": "Payment received after cancellation",
};

function describe(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  if (typeof d.from === "string" && typeof d.to === "string") return `${d.from} → ${d.to}`;
  if (typeof d.txReference === "string") return d.txReference;
  return "";
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrderAdmin((await params).id);
  if (!order) notFound();

  const statusOptions = allowedOrderTransitions(order.status);
  const paymentOptions = allowedManualPaymentTransitions(order.paymentMethod, order.paymentStatus, order.status);
  const wa = whatsappHref(order.customerPhone, `Hello ${order.customerName}, this is about your order ${order.reference}.`);
  const needsRefund = order.status === "CANCELLED" && order.paymentStatus === "PAID";

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All orders
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold">{order.reference}</h1>
        <StatusBadge kind="order" value={order.status} label={ORDER_STATUS_LABELS[order.status]} />
        <StatusBadge kind="payment" value={order.paymentStatus} label={PAYMENT_STATUS_LABELS[order.paymentStatus]} />
        <span className="text-sm text-muted">Placed {formatDate(order.createdAt, true)}</span>
      </div>

      {needsRefund ? (
        <p className="mb-6 flex items-center gap-2 rounded-xl bg-danger-bg p-4 text-sm font-medium text-danger">
          <AlertTriangle className="size-4" aria-hidden /> This order was cancelled after payment. Refund the customer, then record the refund below.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-line text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{i.productName}</p>
                    <p className="text-xs text-muted">
                      {i.variantName ? `${i.variantName} · ` : ""}SKU {i.sku}
                    </p>
                    <p className="text-xs text-muted">
                      {i.quantity} × {formatNaira(i.unitPriceKobo)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatNaira(i.lineTotalKobo)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatNaira(order.subtotalKobo)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>{order.deliveryFeeKobo === null ? "Not set — agree with customer" : formatNaira(order.deliveryFeeKobo)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd>{formatNaira(order.totalKobo)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Notes">
            <div className="space-y-4 p-5">
              <OrderNoteForm orderId={order.id} />
              {order.notes.length ? (
                <ul className="space-y-3">
                  {order.notes.map((n) => (
                    <li key={n.id} className="rounded-xl bg-surface p-3 text-sm">
                      <p className="whitespace-pre-line">{n.body}</p>
                      <p className="mt-1 text-xs text-muted">
                        {n.author} · {formatDate(n.createdAt, true)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No internal notes yet. Notes are visible to staff only.</p>
              )}
            </div>
          </Panel>

          <Panel title="History">
            <ul className="divide-y divide-line text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex flex-wrap justify-between gap-2 px-5 py-2.5">
                  <span>
                    <span className="font-medium">{HISTORY_LABELS[h.action] ?? h.action}</span>
                    {describe(h.details) ? <span className="ml-2 font-mono text-xs text-muted">{describe(h.details)}</span> : null}
                  </span>
                  <span className="text-xs text-muted">
                    {h.actor} · {formatDate(h.createdAt, true)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Fulfilment">
            <div className="p-5">
              <OrderStatusActions orderId={order.id} current={order.status} options={statusOptions} paid={order.paymentStatus === "PAID"} />
            </div>
          </Panel>

          <Panel title="Payment">
            <div className="space-y-3 p-5 text-sm">
              <p>
                <span className="text-muted">Method: </span>
                {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              </p>
              <OrderPaymentActions orderId={order.id} method={order.paymentMethod} current={order.paymentStatus} options={paymentOptions} />
              {order.payments.length ? (
                <ul className="space-y-2 border-t border-line pt-3">
                  {order.payments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2 text-xs">
                      <span className="font-mono">{p.reference}</span>
                      <span>
                        {formatNaira(p.amountKobo)} · <strong>{p.status}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Panel>

          <Panel title="Customer">
            <div className="space-y-3 p-5 text-sm">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p>{order.customerPhone}</p>
                {order.customerEmail ? <p>{order.customerEmail}</p> : null}
                <p className="text-xs text-muted">{order.account ? `Account: ${order.account.email}` : "Guest checkout"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={telHref(order.customerPhone)} className="btn-outline btn-sm">
                  <Phone className="size-3.5" aria-hidden /> Call
                </a>
                {wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm">
                    <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
                  </a>
                ) : null}
              </div>
              <div className="border-t border-line pt-3">
                <p className="mb-1 font-medium">Delivery address</p>
                <p>{order.deliveryAddress}</p>
                <p>
                  {order.deliveryCity}, {order.deliveryState}
                </p>
                {order.deliveryInstructions ? <p className="mt-1 text-muted">“{order.deliveryInstructions}”</p> : null}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
