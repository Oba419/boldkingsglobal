import type { Kobo } from "@/lib/money";

export type PaymentVerification = {
  status: "success" | "failed" | "abandoned" | "pending";
  amountKobo: Kobo;
  currency: string;
  raw: unknown;
};

/**
 * Online payment provider abstraction. Checkout depends only on this
 * interface, so a Flutterwave (or other) implementation can be added without
 * touching order creation.
 */
export interface PaymentProvider {
  readonly id: "PAYSTACK";
  initialize(args: {
    reference: string;
    amountKobo: Kobo;
    email: string;
    callbackUrl: string;
    metadata: Record<string, string>;
  }): Promise<{ authorizationUrl: string }>;
  verify(reference: string): Promise<PaymentVerification>;
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
}
