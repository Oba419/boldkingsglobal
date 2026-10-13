import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageCircle, Phone, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/server/services/catalog";
import { getSettings } from "@/server/services/settings";
import { appUrl } from "@/server/env";
import { ProductGallery } from "@/components/store/product-gallery";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { ProductGrid } from "@/components/store/product-card";
import { Reveal } from "@/components/ui/reveal";
import { koboToDecimalString } from "@/lib/money";
import { telHref, whatsappHref } from "@/lib/phone";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  const description = product.description.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: product.name, description, images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [settings, related] = await Promise.all([getSettings(), getRelatedProducts(product.id, product.category.slug)]);

  const url = appUrl(`/product/${product.slug}`);
  const wa = settings.whatsappNumber ? whatsappHref(settings.whatsappNumber, `Hello, I'm interested in: ${product.name}\n${url}`) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.sku ?? product.variants[0]?.sku,
    image: product.images.map((i) => appUrl(i)),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: koboToDecimalString(v.priceKobo),
      priceCurrency: "NGN",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
    })),
  };

  return (
    <div className="relative">
      {/* Soft brand glow behind the product. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-gold-500/[0.07] to-transparent" aria-hidden />
      <div className="container-page py-8 lg:py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <nav aria-label="Breadcrumb" className="mb-8 animate-fade-in">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Home
              </Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li>
              <Link href={`/category/${product.category.slug}`} className="transition-colors hover:text-ink">
                {product.category.name}
              </Link>
            </li>
            <ChevronRight className="size-3" aria-hidden />
            <li className="line-clamp-1 text-ink" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="animate-fade-up">
            <ProductGallery images={product.images} name={product.name} hint={product.category.slug} />
          </div>

          <div className="animate-fade-up space-y-7 [animation-delay:120ms]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gold-500/12 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-gold-800 uppercase ring-1 ring-gold-500/25 dark:text-gold-300">
                  {product.brand}
                </span>
                <Link href={`/category/${product.category.slug}`} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-ink">
                  {product.category.name}
                </Link>
              </div>
              <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{product.name}</h1>
            </div>

            <div className="card p-5 sm:p-6">
              <PurchasePanel productName={product.name} variants={product.variants} compareAtKobo={product.compareAtKobo} />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline">
                  <MessageCircle className="size-4 text-success" aria-hidden /> Ask on WhatsApp
                </a>
              ) : null}
              <a href={telHref(settings.phonePrimary)} className="btn-outline">
                <Phone className="size-4 text-gold-600" aria-hidden /> Call {settings.phonePrimary}
              </a>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              <li className="flex gap-3 rounded-2xl border border-line bg-surface/60 p-4 text-sm">
                <Truck className="size-5 shrink-0 text-gold-600" aria-hidden />
                <span className="text-ink/80">{settings.deliveryNotes ?? "Delivery across Nigeria. We confirm cost and timing with you after you order."}</span>
              </li>
              <li className="flex gap-3 rounded-2xl border border-line bg-surface/60 p-4 text-sm">
                <ShieldCheck className="size-5 shrink-0 text-gold-600" aria-hidden />
                <span className="text-ink/80">
                  Questions about warranty or condition?{" "}
                  <Link href="/contact" className="font-semibold text-ink underline decoration-gold-500/60 underline-offset-4">
                    Contact us
                  </Link>{" "}
                  before you buy.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Reveal as="section" className="card p-6 sm:p-8">
            <h2 id="desc-heading" className="mb-4 flex items-center gap-3 text-xl font-semibold">
              <span className="h-5 w-1 rounded-full bg-gold-gradient" aria-hidden /> Description
            </h2>
            <div className="space-y-3 leading-7 whitespace-pre-line text-ink/80">{product.description}</div>
          </Reveal>
          {product.specifications.length ? (
            <Reveal as="section" delay={100} className="card overflow-hidden">
              <h2 id="spec-heading" className="flex items-center gap-3 px-6 pt-6 pb-4 text-xl font-semibold sm:px-8 sm:pt-8">
                <span className="h-5 w-1 rounded-full bg-gold-gradient" aria-hidden /> Specifications
              </h2>
              <dl className="divide-y divide-line border-t border-line text-sm">
                {product.specifications.map((s, i) => (
                  <div key={i} className="grid grid-cols-[42%_1fr] gap-3 px-6 py-3.5 transition-colors hover:bg-surface/60 sm:px-8">
                    <dt className="font-medium text-muted">{s.label}</dt>
                    <dd className="font-medium text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ) : null}
        </div>

        {related.length ? (
          <section className="mt-20" aria-labelledby="related-heading">
            <Reveal className="mb-8 space-y-2">
              <p className="eyebrow">More like this</p>
              <h2 id="related-heading" className="section-title">
                You may also like
              </h2>
            </Reveal>
            <ProductGrid products={related} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
