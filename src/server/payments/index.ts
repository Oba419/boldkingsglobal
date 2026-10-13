import "server-only";
import { getServerEnv } from "../env";
import { PaystackProvider } from "./paystack";
import type { PaymentProvider } from "./types";

let provider: PaymentProvider | null | undefined;

/** Returns the configured online payment provider, or null when none is configured. */
export function getPaymentProvider(): PaymentProvider | null {
  if (provider !== undefined) return provider;
  const key = getServerEnv().PAYSTACK_SECRET_KEY;
  provider = key ? new PaystackProvider(key) : null;
  return provider;
}

export function isOnlinePaymentConfigured(): boolean {
  return getPaymentProvider() !== null;
}

/** Test hook: override the provider (e.g. with a fake) in integration tests. */
export function __setPaymentProviderForTests(p: PaymentProvider | null | undefined) {
  provider = p;
}
