import Link from "next/link";
import type { ProductCardDTO } from "@/types/catalog";
import { Reveal } from "@/components/ui/reveal";
import { ProductImage } from "./product-image";
import { Price } from "./price";
import { QuickAddButton } from "./quick-add-button";

export function ProductCard({ product, priority = false }: { product: ProductCardDTO; priority?: boolean }) {
  const discount =
    product.compareAtKobo && product.compareAtKobo > product.priceKobo ? Math.round(((product.compareAtKobo - product.priceKobo) / product.compareAtKobo) * 100) : 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-lift">
      <div className="relative aspect-square overflow-hidden">
        <div className="h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.06]">
          <ProductImage src={product.image} alt={product.name} hint={product.category.slug} priority={priority} />
        </div>
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {discount > 0 ? <span className="rounded-full bg-gold-gradient px-2.5 py-1 text-[11px] font-bold text-navy-950 shadow-sm">−{discount}%</span> : null}
          {!product.inStock ? <span className="rounded-full bg-navy-950/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">Out of stock</span> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-line/70 p-4">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-gold-800 uppercase dark:text-gold-400">{product.brand}</p>
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-ink">
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price kobo={product.priceKobo} compareAtKobo={product.compareAtKobo} from={product.hasPriceRange} />
          {product.quickAddVariantId ? <QuickAddButton variantId={product.quickAddVariantId} name={product.name} /> : null}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardDTO[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <Reveal as="li" key={p.id} delay={(i % 4) * 70}>
          <ProductCard product={p} priority={i < priorityCount} />
        </Reveal>
      ))}
    </ul>
  );
}
