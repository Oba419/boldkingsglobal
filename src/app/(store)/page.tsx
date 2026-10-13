import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageCircle, Phone, ShieldCheck, Truck } from "lucide-react";
import { getFeaturedProducts, getNewArrivals, listCategories } from "@/server/services/catalog";
import { getSettings } from "@/server/services/settings";
import { ProductGrid } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { Reveal } from "@/components/ui/reveal";
import { telHref, whatsappHref } from "@/lib/phone";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const [settings, categories, featured, arrivals] = await Promise.all([getSettings(), listCategories(), getFeaturedProducts(8), getNewArrivals(8)]);
  const wa = settings.whatsappNumber ? whatsappHref(settings.whatsappNumber, `Hello ${settings.businessName}, I'd like to make an enquiry.`) : null;

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-gradient text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" aria-hidden />
        <div className="pointer-events-none absolute -top-40 right-0 -z-10 size-[520px] animate-glow rounded-full bg-gold-500/20 blur-[120px]" aria-hidden />
        <div className="container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div className="space-y-7">
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-gold-300 backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-gold-400" aria-hidden />
              {SITE.tagline}
            </p>
            <h1 className="animate-fade-up text-4xl leading-[1.08] font-extrabold tracking-tight [animation-delay:80ms] sm:text-5xl lg:text-6xl">
              Premium tech,
              <br />
              <span className="text-gold-gradient">fit for royalty.</span>
            </h1>
            <p className="max-w-xl animate-fade-up text-lg leading-relaxed text-slate-300 [animation-delay:160ms]">
              Genuine smartphones, laptops, audio and accessories at honest naira prices — delivered across Nigeria, with real people on the phone and WhatsApp to help you choose.
            </p>
            <div className="flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <Link href="/shop" className="btn-gold h-12 px-7 text-[15px]">
                Shop the collection <ArrowRight className="size-4" aria-hidden />
              </Link>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline-light h-12 px-6">
                  <MessageCircle className="size-4" aria-hidden /> Chat on WhatsApp
                </a>
              ) : (
                <a href={telHref(settings.phonePrimary)} className="btn-outline-light h-12 px-6">
                  <Phone className="size-4" aria-hidden /> Call {settings.phonePrimary}
                </a>
              )}
            </div>
            <ul className="flex animate-fade-up flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-slate-400 [animation-delay:320ms]">
              {["Genuine products", "Nationwide delivery", "Secure checkout"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-gold-400" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-fade-in [animation-delay:200ms] lg:max-w-none">
            <div className="absolute inset-6 rounded-[2rem] bg-gold-500/25 blur-3xl" aria-hidden />
            <div className="relative animate-float">
              <div className="rounded-[2rem] bg-gradient-to-br from-gold-300/60 via-gold-600/30 to-gold-300/50 p-px shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]">
                <div className="relative aspect-[432/292] overflow-hidden rounded-[calc(2rem-1px)]">
                  <Image src="/images/brand/crest.jpg" alt={`${SITE.name} crest`} fill priority sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 via-transparent to-transparent" aria-hidden />
                </div>
              </div>
              {categories[0] ? (
                <Link
                  href={`/category/${categories[0].slug}`}
                  className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-2xl border border-white/10 bg-navy-900/80 p-3 pr-5 shadow-lift backdrop-blur-xl transition-transform hover:-translate-y-0.5 sm:flex"
                >
                  <span className="relative size-11 overflow-hidden rounded-xl">
                    <ProductImage src={categories[0].image} alt="" hint={categories[0].slug} sizes="44px" />
                  </span>
                  <span>
                    <span className="block text-[11px] tracking-wider text-slate-400 uppercase">Trending</span>
                    <span className="block text-sm font-semibold">{categories[0].name}</span>
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust strip ──────────────────────────────────────────────────── */}
      <section aria-label="Why shop with us" className="relative z-10 container-page -mt-8">
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-lift sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Clear, upfront pricing", body: "Every price is in naira and confirmed by our system at checkout." },
            { icon: Truck, title: "Delivery across Nigeria", body: settings.deliveryNotes ?? "We confirm delivery details with you before dispatch." },
            { icon: Phone, title: "Talk to a real person", body: `Call ${settings.phonePrimary} for help choosing.` },
          ].map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 90} className="flex gap-4 bg-card p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-navy-950 shadow-[0_6px_20px_-8px_rgb(214_168_79/0.8)]">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ─── Categories ───────────────────────────────────────────────────── */}
      {categories.length ? (
        <section className="container-page pt-20 pb-6">
          <SectionHeading eyebrow="Browse" title="Shop by category" href="/shop" />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {categories.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 60}>
                <Link
                  href={`/category/${c.slug}`}
                  className="group relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl border border-line bg-card p-4 text-center shadow-card transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-lift"
                >
                  <span className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gold-500/0 blur-2xl transition-colors duration-500 group-hover:bg-gold-500/20" aria-hidden />
                  <span className="relative block aspect-square w-full overflow-hidden rounded-xl">
                    <span className="block h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-110">
                      <ProductImage src={c.image} alt="" hint={c.slug} sizes="(min-width: 1024px) 14vw, 30vw" />
                    </span>
                  </span>
                  <span className="relative text-sm font-semibold">{c.name}</span>
                  <span className="relative -mt-2 text-xs text-muted">
                    {c.productCount ?? 0} product{c.productCount === 1 ? "" : "s"}
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {featured.length ? (
        <section className="container-page py-14">
          <SectionHeading eyebrow="Hand-picked" title="Featured products" href="/shop" />
          <ProductGrid products={featured} />
        </section>
      ) : null}

      {arrivals.length ? (
        <section className="container-page py-6">
          <SectionHeading eyebrow="Just in" title="New arrivals" href="/shop?sort=newest" />
          <ProductGrid products={arrivals} />
        </section>
      ) : (
        <section className="container-page py-20 text-center">
          <h2 className="section-title">Our catalogue is being stocked</h2>
          <p className="mt-2 text-muted">
            New products are on the way. Call{" "}
            <a href={telHref(settings.phonePrimary)} className="font-medium text-ink underline">
              {settings.phonePrimary}
            </a>{" "}
            to ask about availability.
          </p>
        </section>
      )}

      {/* ─── Enquiry CTA ──────────────────────────────────────────────────── */}
      <Reveal as="section" className="container-page pt-16">
        <div className="relative isolate overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white shadow-lift sm:p-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" aria-hidden />
          <div className="pointer-events-none absolute -right-20 -bottom-24 -z-10 size-80 rounded-full bg-gold-500/25 blur-3xl" aria-hidden />
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl space-y-3">
              <p className="font-display text-sm font-semibold tracking-[0.25em] text-gold-400 uppercase">Concierge</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Can&apos;t find what you need?</h2>
              <p className="text-slate-300">Tell us the model you&apos;re after and we&apos;ll check availability and price for you.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-gold h-12 px-6">
                Send an enquiry <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href={telHref(settings.phonePrimary)} className="btn-outline-light h-12 px-6">
                <Phone className="size-4" aria-hidden /> {settings.phonePrimary}
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}

function SectionHeading({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-4">
      <div className="space-y-2">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="group hidden items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-gold-700 sm:flex dark:hover:text-gold-400">
          View all <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      ) : null}
    </Reveal>
  );
}
