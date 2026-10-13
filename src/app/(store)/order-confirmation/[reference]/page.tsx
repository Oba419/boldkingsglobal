import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Phone } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { getOrderForViewer } from "@/server/services/orders";
import { getSettings } from "@/server/services/settings";
import { formatNaira } from "@/lib/money";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-rules";
import { telHref } from "@/lib/phone";
import { formatDate } from "@/lib/utils";
import { ProductImage } from "@/components/store/product-image";
import { PayNowButton } from "@/components/store/pay-now-button";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false }, referrer: "no-referrer" };

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ token?: string; payment?: string }>;
};

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { reference } = await params;
  const { token, payment } = await searchParams;
  const [order, settings] = await Promise.all([getOrderForViewer(reference, token, await getCurrentUser()), getSettings()]);

  if (!order) {
    return (
      <div className="container-page max-w-xl py-16 text-center">
        <h1 className="section-title">Order not found</h1>
        <p className="mt-3 text-muted">
          This link may be incomplete. Sign in to the account you ordered with, or call us on{" "}
          <a href={telHref(settings.phonePrimary)} className="font-medium text-ink underline">
            {settings.phonePrimary}
          </a>{" "}
          with your order reference.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account/login" className="btn-primary">
            Sign in
          </Link>
          <Link href="/" className="btn-outline">
            Home
          </Link>
        </div>
      </div>
    );
  }

  const paid = order.paymentStatus === "PAID";
  const cancelled = order.status === "CANCELLED";
  const canPayOnline = order.paymentMethod === "PAYSTACK" && !paid && !cancelled;

  return (
    <div className="container-page max-w-3xl animate-fade-up py-14">
      <div className="mb-10 space-y-4 text-center">
        {cancelled ? (
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-danger-bg ring-8 ring-danger-bg/50"><AlertTriangle className="size-10 text-danger" aria-hidden /></span>
        ) : paid || order.paymentMethod !== "PAYSTACK" ? (
          <span className="mx-auto flex size-20 animate-pop items-center justify-center rounded-full bg-gold-gradient shadow-glow ring-8 ring-gold-500/15"><CheckCircle2 className="size-10 text-navy-950" aria-hidden /></span>
        ) : (
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-warn-bg ring-8 ring-warn-bg/50"><Clock className="size-10 text-warn" aria-hidden /></span>
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {cancelled ? "This order was cancelled" : paid ? "Thank you — payment received" : order.paymentMethod === "PAYSTACK" ? "Your order is awaiting payment" : "Thank you — your order is placed"}
        </h1>
        <p className="text-muted">
          Order reference <strong className="rounded-lg bg-surface px-2 py-0.5 font-mono text-ink ring-1 ring-line">{order.reference}</strong> · {formatDate(order.createdAt, true)}
        </p>
      </div>

      {payment === "failed" || payment === "mismatch" ? (
        <Banner tone="danger">Your payment was not completed. No money has been recorded for this order. You can try again below or choose to call us.</Banner>
      ) : payment === "pending" ? (
        <Banner tone="warn">We&apos;re still waiting for confirmation from Paystack. This page will show &quot;Paid&quot; once it&apos;s confirmed — refresh in a minute.</Banner>
      ) : payment === "error" ? (
        <Banner tone="warn">Your order is saved, but we couldn&apos;t open the payment page. Please try paying again below.</Banner>
      ) : null}

      {token ? (
        <Banner tone="info">Bookmark this page or save the link — it&apos;s how you can view this order later without an account.</Banner>
      ) : null}

      {canPayOnline ? (
        <div className="card mb-6 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <p className="text-sm">Complete your payment of <strong>{formatNaira(order.totalKobo)}</strong> securely with Paystack.</p>
          <PayNowButton reference={order.reference} token={token ?? null} />
        </div>
      ) : null}

      {order.paymentMethod === "BANK_TRANSFER" && !paid && !cancelled && settings.bankTransferEnabled ? (
        <div className="card mb-6 space-y-2 p-5">
          <h2 className="font-semibold">Complete your bank transfer</h2>
          <dl className="grid gap-1 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-muted">Amount</dt>
            <dd className="font-semibold">{formatNaira(order.totalKobo)}</dd>
            <dt className="text-muted">Bank</dt>
            <dd>{settings.bankName}</dd>
            <dt className="text-muted">Account number</dt>
            <dd className="font-mono">{settings.bankAccountNumber}</dd>
            <dt className="text-muted">Account name</dt>
            <dd>{settings.bankAccountName}</dd>
            <dt className="text-muted">Narration</dt>
            <dd className="font-mono">{order.reference}</dd>
          </dl>
          <p className="text-sm text-muted">We&apos;ll confirm receipt and update your order. Call us if you need help.</p>
        </div>
      ) : null}

      {order.paymentMethod === "PAY_ON_DELIVERY" && !cancelled ? (
        <p className="mb-6 rounded-2xl border border-line bg-surface p-4 text-sm">We&apos;ll call you on <strong>{order.customerPhone}</strong> to confirm your order and arrange delivery. Please have the payment ready when it arrives.</p>
      ) : null}

      <section className="card relative divide-y divide-line overflow-hidden">
        <div className="h-1 bg-gold-gradient" aria-hidden />
        <div className="flex flex-wrap gap-4 p-5 text-sm">
          <div>
            <p className="text-muted">Order status</p>
            <StatusBadge kind="order" value={order.status} label={ORDER_STATUS_LABELS[order.status]} />
          </div>
          <div>
            <p className="text-muted">Payment</p>
            <StatusBadge kind="payment" value={order.paymentStatus} label={PAYMENT_STATUS_LABELS[order.paymentStatus]} />
          </div>
          <div>
            <p className="text-muted">Method</p>
            <p className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          </div>
        </div>

        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex gap-4 p-5">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-line">
                <ProductImage src={i.image} alt="" sizes="64px" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{i.productName}</p>
                {i.variantName ? <p className="text-muted">{i.variantName}</p> : null}
                <p className="text-muted">
                  {i.quantity} × {formatNaira(i.unitPriceKobo)}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatNaira(i.lineTotalKobo)}</p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 p-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatNaira(order.subtotalKobo)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd>{order.deliveryFeeKobo === null ? "To be confirmed" : order.deliveryFeeKobo === 0 ? "Free" : formatNaira(order.deliveryFeeKobo)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd>{formatNaira(order.totalKobo)}</dd>
          </div>
          {order.deliveryFeeKobo === null ? <p className="text-xs text-muted">The delivery cost for your location will be confirmed with you and is not included in this total.</p> : null}
        </dl>

        <div className="grid gap-4 p-5 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 font-semibold">Delivery to</p>
            <p>{order.customerName}</p>
            <p>{order.deliveryAddress}</p>
            <p>
              {order.deliveryCity}, {order.deliveryState}
            </p>
            {order.deliveryInstructions ? <p className="mt-1 text-muted">“{order.deliveryInstructions}”</p> : null}
          </div>
          <div>
            <p className="mb-1 font-semibold">Contact</p>
            <p>{order.customerPhone}</p>
            {order.customerEmail ? <p>{order.customerEmail}</p> : null}
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">
          Continue shopping
        </Link>
        <a href={telHref(settings.phonePrimary)} className="btn-outline">
          <Phone className="size-4" aria-hidden /> Questions? {settings.phonePrimary}
        </a>
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "danger" | "warn" | "info"; children: React.ReactNode }) {
  const styles = { danger: "bg-danger-bg text-danger", warn: "bg-warn-bg text-warn", info: "bg-surface text-ink" }[tone];
  return (
    <p className={`mb-6 animate-fade-up rounded-2xl p-4 text-sm ${styles}`} role={tone === "info" ? undefined : "alert"}>
      {children}
    </p>
  );
}
