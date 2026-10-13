"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatusValue,
  type PaymentMethodValue,
  type PaymentStatusValue,
} from "@/lib/order-rules";

function useAction() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setPending(key);
    try {
      await fn();
      toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(null);
    }
  }
  return { pending, run };
}

const STATUS_VERBS: Partial<Record<OrderStatusValue, string>> = {
  CONFIRMED: "Confirm order",
  PROCESSING: "Mark processing",
  SHIPPED: "Mark shipped",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order",
};

export function OrderStatusActions({ orderId, current, options, paid }: { orderId: string; current: OrderStatusValue; options: OrderStatusValue[]; paid: boolean }) {
  const { pending, run } = useAction();
  if (!options.length) {
    return <p className="text-sm text-muted">This order is {ORDER_STATUS_LABELS[current].toLowerCase()}. No further status changes are possible.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((to) => {
        const cancel = to === "CANCELLED";
        return (
          <button
            key={to}
            type="button"
            className={cancel ? "btn-outline btn-sm text-danger" : "btn-primary btn-sm"}
            disabled={pending !== null}
            onClick={() => {
              if (cancel && !confirm(`Cancel this order? Reserved stock will be returned to inventory.${paid ? " The customer has paid — you will need to refund them." : ""}`)) return;
              run(to, () => api(`/api/admin/orders/${orderId}/status`, { body: { status: to } }), `Order ${ORDER_STATUS_LABELS[to].toLowerCase()}`);
            }}
          >
            {pending === to ? "Saving…" : (STATUS_VERBS[to] ?? ORDER_STATUS_LABELS[to])}
          </button>
        );
      })}
    </div>
  );
}

const PAYMENT_VERBS: Partial<Record<PaymentStatusValue, string>> = {
  PAID: "Mark as paid",
  FAILED: "Mark payment failed",
  REFUNDED: "Record refund",
};

export function OrderPaymentActions({ orderId, method, current, options }: { orderId: string; method: PaymentMethodValue; current: PaymentStatusValue; options: PaymentStatusValue[] }) {
  const { pending, run } = useAction();
  if (!options.length) {
    return (
      <p className="text-muted">
        {method === "PAYSTACK" && current !== "PAID"
          ? "Online payments are confirmed automatically by Paystack and cannot be marked paid by hand."
          : "No manual payment changes are available for this order."}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((to) => (
        <button
          key={to}
          type="button"
          className={to === "PAID" ? "btn-primary btn-sm" : "btn-outline btn-sm"}
          disabled={pending !== null}
          onClick={() => {
            const msg =
              to === "PAID"
                ? "Confirm that the full payment has been received for this order?"
                : to === "REFUNDED"
                  ? "Confirm that the customer has been refunded? This does not send money — it only records the refund."
                  : "Mark this payment as failed?";
            if (!confirm(msg)) return;
            run(to, () => api(`/api/admin/orders/${orderId}/payment`, { body: { paymentStatus: to } }), `Payment: ${PAYMENT_STATUS_LABELS[to]}`);
          }}
        >
          {pending === to ? "Saving…" : (PAYMENT_VERBS[to] ?? PAYMENT_STATUS_LABELS[to])}
        </button>
      ))}
    </div>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setPending(true);
        try {
          await api(`/api/admin/orders/${orderId}/notes`, { body: { body } });
          setBody("");
          router.refresh();
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setPending(false);
        }
      }}
    >
      <label htmlFor="order-note" className="sr-only">
        Add a note
      </label>
      <textarea id="order-note" value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={2000} placeholder="Add an internal note (e.g. called customer, delivery booked)" className="input" />
      <button type="submit" className="btn-outline btn-sm" disabled={pending || !body.trim()}>
        {pending ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
