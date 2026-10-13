"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

export function ProductGallery({ images, name, hint }: { images: string[]; name: string; hint: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="space-y-3 lg:sticky lg:top-36 lg:self-start">
      <div className="group relative aspect-square overflow-hidden rounded-3xl border border-line bg-card shadow-card">
        {/* Keyed so each photo fades in when selected. */}
        <div key={current ?? "none"} className="h-full w-full animate-fade-in transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]">
          <ProductImage src={current} alt={name} hint={hint} sizes="(min-width: 1024px) 50vw, 100vw" priority />
        </div>
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2.5" aria-label="Product photos">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border bg-media transition-all duration-300",
                  i === active ? "border-gold-500 ring-4 ring-gold-500/20" : "border-line opacity-70 hover:opacity-100",
                )}
              >
                <Image src={src} alt="" fill sizes="96px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
