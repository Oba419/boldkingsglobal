import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getPaymentProvider } from "@/server/payments";
import { confirmOnlinePayment } from "@/server/services/orders";
import { isUniqueConstraintError } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook. Signature verified with HMAC-SHA512; each event is
 * recorded once (WebhookEvent.eventKey is unique) and processing is
 * idempotent, so redeliveries are harmless. The payment is re-verified with
 * the Paystack API rather than trusting the webhook body's status/amount.
 */
export async function POST(req: Request) {
  const provider = getPaymentProvider();
  if (!provider) return NextResponse.json({ ok: false }, { status: 404 });

  const raw = await req.text();
  if (raw.length > 200_000 || !provider.verifyWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: { event?: string; data?: { id?: number | string; reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const type = event.event ?? "unknown";
  const reference = event.data?.reference;
  const eventKey = `paystack:${type}:${event.data?.id ?? reference ?? "none"}`;

  const seen = await db.webhookEvent.findUnique({ where: { eventKey } });
  if (seen) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (type === "charge.success" && reference) await confirmOnlinePayment(reference);
  } catch (err) {
    console.error("[paystack] webhook processing failed", err);
    // Non-2xx makes Paystack retry later.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  try {
    await db.webhookEvent.create({ data: { provider: "PAYSTACK", eventKey, type, payload: JSON.parse(raw) } });
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
  }
  return NextResponse.json({ ok: true });
}
