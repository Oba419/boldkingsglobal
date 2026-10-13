import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/server/services/settings";
import { PageHero } from "@/components/store/page-hero";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

// Describes exactly what this application stores. Have it reviewed against the
// Nigeria Data Protection Act 2023 before launch (see README).
export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <>
    <PageHero eyebrow="Legal" title="Privacy policy" crumbs={[{ label: "Privacy policy" }]} />
    <div className="container-page py-12">
    <div className="card prose-page mx-auto max-w-3xl animate-fade-up p-6 sm:p-10">

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Orders:</strong> your name, phone number, optional email address, delivery address and the items you bought.
        </li>
        <li>
          <strong>Accounts (optional):</strong> your name, email address and a securely hashed password. We never store your password itself.
        </li>
        <li>
          <strong>Messages:</strong> anything you send through our contact form, plus the contact details you provide.
        </li>
        <li>
          <strong>Newsletter:</strong> your email address, if you subscribe.
        </li>
      </ul>

      <h2>Payments</h2>
      <p>Online payments are processed by Paystack. Your card or bank details go directly to Paystack and are never sent to or stored by us.</p>

      <h2>How we use it</h2>
      <p>We use your details to process and deliver orders, contact you about them, answer your enquiries and, if you subscribed, send you news about products and offers.</p>

      <h2>Cookies</h2>
      <p>We use one essential cookie to keep you signed in. Your cart is stored in your own browser. We do not use advertising cookies.</p>

      <h2>Your choices</h2>
      <p>
        To access, correct or delete your information, or to unsubscribe, contact us through our <Link href="/contact">contact page</Link>
        {s.supportEmail ? (
          <>
            {" "}
            or at <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a>
          </>
        ) : null}
        .
      </p>
    </div>
    </div>
    </>
  );
}
