import { NextResponse } from "next/server";
import { appUrl } from "@/server/env";
import { confirmOnlinePayment } from "@/server/services/orders";

export const dynamic = "force-dynamic";

/**
 * Paystack redirects the customer here after checkout. The redirect itself
 * proves nothing — we verify the transaction server-to-server before showing
 * the confirmation page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = url.searchParams.get("order") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const txRef = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
  const target = new URL(appUrl(`/order-confirmation/${encodeURIComponent(order)}`));
  target.searchParams.set("token", token);
  if (txRef) {
    try {
      const result = await confirmOnlinePayment(txRef);
      target.searchParams.set("payment", result.outcome);
    } catch (err) {
      console.error("[paystack] callback verification failed", err);
      target.searchParams.set("payment", "pending");
    }
  }
  return NextResponse.redirect(target, 303);
}
