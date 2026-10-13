import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/server/services/settings";
import { formatNaira } from "@/lib/money";
import { telHref } from "@/lib/phone";
import { PageHero } from "@/components/store/page-hero";

export const metadata: Metadata = { title: "Delivery & returns", alternates: { canonical: "/delivery-returns" } };

// Draft copy: the returns section must be reviewed and completed by the business before launch (see README).
export default async function DeliveryReturnsPage() {
  const s = await getSettings();
  return (
    <>
    <PageHero eyebrow="Help" title="Delivery & returns" crumbs={[{ label: "Delivery & returns" }]} />
    <div className="container-page py-12">
    <div className="card prose-page mx-auto max-w-3xl animate-fade-up p-6 sm:p-10">

      <h2>Delivery</h2>
      <p>We deliver to all 36 states and the FCT.</p>
      {s.deliveryFeeKobo !== null ? (
        <p>
          Delivery fee: <strong>{s.deliveryFeeKobo === 0 ? "Free" : formatNaira(s.deliveryFeeKobo)}</strong>, shown in your order total at checkout.
        </p>
      ) : (
        <p>Delivery cost depends on your location. After you order, we&apos;ll contact you to confirm the cost and timing before dispatch.</p>
      )}
      {s.deliveryNotes ? <p>{s.deliveryNotes}</p> : null}

      <h2>Order updates</h2>
      <p>
        You can see the status of your order at any time from the link on your order confirmation page, or from <Link href="/account">your account</Link> if you were signed in when ordering.
      </p>

      <h2>Returns and faulty items</h2>
      <p>
        If something is wrong with your order, contact us as soon as possible on <a href={telHref(s.phonePrimary)}>{s.phonePrimary}</a> or through our <Link href="/contact">contact page</Link>, quoting your order reference. Please keep the item, its box and all accessories.
      </p>

      <h2>Cancellations</h2>
      <p>To cancel an order, contact us before it has been shipped. If you have already paid, we will arrange your refund.</p>
    </div>
    </div>
    </>
  );
}
