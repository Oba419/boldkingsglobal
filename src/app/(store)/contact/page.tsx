import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSettings } from "@/server/services/settings";
import { telHref, whatsappHref } from "@/lib/phone";
import { ContactForm } from "@/components/store/contact-form";
import { PageHero } from "@/components/store/page-hero";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Call, WhatsApp or send us a message about products, orders or delivery.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const wa = s.whatsappNumber ? whatsappHref(s.whatsappNumber, `Hello ${s.businessName}, I have a question.`) : null;

  return (
    <>
    <PageHero eyebrow="We’re here to help" title="Contact us" crumbs={[{ label: "Contact" }]} description="Questions about a product, an order or delivery? The fastest way to reach us is by phone or WhatsApp. You can also send a message and we’ll get back to you." />
    <div className="container-page py-12">

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <ul className="space-y-3">
          <li className="card flex gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/40 hover:shadow-lift">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-navy-950"><Phone className="size-5" aria-hidden /></span>
            <div>
              <p className="font-semibold">Call us</p>
              <a href={telHref(s.phonePrimary)} className="block text-lg hover:underline">
                {s.phonePrimary}
              </a>
              {s.phoneSecondary ? (
                <a href={telHref(s.phoneSecondary)} className="block text-lg hover:underline">
                  {s.phoneSecondary}
                </a>
              ) : null}
            </div>
          </li>
          {wa ? (
            <li className="card flex gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/40 hover:shadow-lift">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-navy-950"><MessageCircle className="size-5" aria-hidden /></span>
              <div>
                <p className="font-semibold">WhatsApp</p>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Chat with us on {s.whatsappNumber}
                </a>
              </div>
            </li>
          ) : null}
          {s.supportEmail ? (
            <li className="card flex gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/40 hover:shadow-lift">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-navy-950"><Mail className="size-5" aria-hidden /></span>
              <div>
                <p className="font-semibold">Email</p>
                <a href={`mailto:${s.supportEmail}`} className="hover:underline">
                  {s.supportEmail}
                </a>
              </div>
            </li>
          ) : null}
          {s.address ? (
            <li className="card flex gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/40 hover:shadow-lift">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-navy-950"><MapPin className="size-5" aria-hidden /></span>
              <div>
                <p className="font-semibold">Address</p>
                <p>{s.address}</p>
              </div>
            </li>
          ) : null}
        </ul>

        <section className="card p-6 sm:p-8" aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading" className="mb-6 text-xl font-semibold">
            Send a message
          </h2>
          <ContactForm />
        </section>
      </div>
    </div>
    </>
  );
}
