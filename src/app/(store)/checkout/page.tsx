import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getCurrentUser } from "@/server/auth/session";
import { availablePaymentOptions, getSettings } from "@/server/services/settings";
import { telHref } from "@/lib/phone";
import { PageHero } from "@/components/store/page-hero";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const options = availablePaymentOptions(settings);

  return (
    <>
    <PageHero title="Checkout" eyebrow="Secure checkout" crumbs={[{ href: "/cart", label: "Cart" }, { label: "Checkout" }]} />
    <div className="container-page py-10">
      {options.length ? (
        <CheckoutForm
          paymentOptions={options}
          prefill={user ? { fullName: user.name, email: user.email } : null}
          bank={
            settings.bankTransferEnabled
              ? { bankName: settings.bankName!, accountName: settings.bankAccountName!, accountNumber: settings.bankAccountNumber! }
              : null
          }
        />
      ) : (
        <div className="card max-w-xl space-y-3 p-6">
          <p className="font-semibold">Online ordering is temporarily unavailable.</p>
          <p className="text-sm text-muted">Please call us to place your order and we&apos;ll take care of everything.</p>
          <a href={telHref(settings.phonePrimary)} className="btn-primary">
            <Phone className="size-4" aria-hidden /> Call {settings.phonePrimary}
          </a>
        </div>
      )}
    </div>
    </>
  );
}
