import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider, PaymentVerification } from "./types";

const API = "https://api.paystack.co";

/**
 * Paystack integration using the official REST API
 * (https://paystack.com/docs/api/transaction/). Amounts are sent in kobo,
 * which matches our internal representation. The secret key is only ever
 * used server-side.
 */
export class PaystackProvider implements PaymentProvider {
  readonly id = "PAYSTACK" as const;

  constructor(private readonly secretKey: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
    if (!res.ok || !body?.status || body.data === undefined) {
      throw new Error(`Paystack ${path} failed: ${res.status} ${body?.message ?? "no message"}`);
    }
    return body.data;
  }

  async initialize(args: { reference: string; amountKobo: number; email: string; callbackUrl: string; metadata: Record<string, string> }) {
    const data = await this.request<{ authorization_url: string }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        reference: args.reference,
        amount: args.amountKobo,
        currency: "NGN",
        email: args.email,
        callback_url: args.callbackUrl,
        metadata: args.metadata,
      }),
    });
    return { authorizationUrl: data.authorization_url };
  }

  async verify(reference: string): Promise<PaymentVerification> {
    const data = await this.request<{ status: string; amount: number; currency: string }>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );
    const status: PaymentVerification["status"] =
      data.status === "success" ? "success" : data.status === "failed" ? "failed" : data.status === "abandoned" ? "abandoned" : "pending";
    return { status, amountKobo: data.amount, currency: data.currency, raw: data };
  }

  /** Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key. */
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = createHmac("sha512", this.secretKey).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
