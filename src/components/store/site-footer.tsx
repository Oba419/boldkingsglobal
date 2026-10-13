import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { telHref, whatsappHref } from "@/lib/phone";
import type { StoreSettingsDTO } from "@/types/settings";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 font-display text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">{children}</h2>;
}

const linkCls = "inline-block text-slate-400 transition-all duration-200 hover:translate-x-0.5 hover:text-white";

export function SiteFooter({ settings, categories }: { settings: StoreSettingsDTO; categories: { name: string; slug: string }[] }) {
  const wa = settings.whatsappNumber ? whatsappHref(settings.whatsappNumber, `Hello ${settings.businessName}, I have a question.`) : null;
  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-gradient text-slate-300">
      <div className="h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden />

      <div className="relative container-page">
        {/* Newsletter band */}
        <div className="grid items-center gap-6 border-b border-white/[0.08] py-12 lg:grid-cols-2">
          <div>
            <p className="font-display text-2xl font-bold text-gold-gradient sm:text-3xl">Be first to the new arrivals.</p>
            <p className="mt-2 text-sm text-slate-400">Occasional emails about new stock and genuine offers. No spam.</p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-5">
            <Logo size="lg" />
            <p className="max-w-sm text-sm leading-6 text-slate-400">{SITE.description}</p>
          </div>

          <div>
            <FooterHeading>Shop</FooterHeading>
            <ul className="space-y-2.5 text-sm">
              {categories.slice(0, 7).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className={linkCls}>
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className={linkCls}>
                  All products
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <FooterHeading>Help</FooterHeading>
            <ul className="space-y-2.5 text-sm">
              {[
                ["/contact", "Contact us"],
                ["/delivery-returns", "Delivery & returns"],
                ["/account", "My orders"],
                ["/about", "About us"],
                ["/privacy", "Privacy policy"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href!} className={linkCls}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Get in touch</FooterHeading>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <ContactIcon>
                  <Phone className="size-3.5" aria-hidden />
                </ContactIcon>
                <span className="space-y-0.5">
                  <a href={telHref(settings.phonePrimary)} className="block text-white hover:text-gold-300">
                    {settings.phonePrimary}
                  </a>
                  {settings.phoneSecondary ? (
                    <a href={telHref(settings.phoneSecondary)} className="block text-white hover:text-gold-300">
                      {settings.phoneSecondary}
                    </a>
                  ) : null}
                </span>
              </li>
              {wa ? (
                <li className="flex items-center gap-3">
                  <ContactIcon>
                    <MessageCircle className="size-3.5" aria-hidden />
                  </ContactIcon>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="text-white hover:text-gold-300">
                    Chat on WhatsApp
                  </a>
                </li>
              ) : null}
              {settings.supportEmail ? (
                <li className="flex items-center gap-3">
                  <ContactIcon>
                    <Mail className="size-3.5" aria-hidden />
                  </ContactIcon>
                  <a href={`mailto:${settings.supportEmail}`} className="text-white hover:text-gold-300">
                    {settings.supportEmail}
                  </a>
                </li>
              ) : null}
              {settings.address ? (
                <li className="flex gap-3">
                  <ContactIcon>
                    <MapPin className="size-3.5" aria-hidden />
                  </ContactIcon>
                  <span>{settings.address}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/[0.08]">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
          </p>
          <p>Prices are in Nigerian naira (₦).</p>
        </div>
      </div>
    </footer>
  );
}

function ContactIcon({ children }: { children: React.ReactNode }) {
  return <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/25">{children}</span>;
}
