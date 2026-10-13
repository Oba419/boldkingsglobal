import Image from "next/image";
import { Cable, Gamepad2, Headphones, Laptop, Package, Smartphone, Tablet, Watch } from "lucide-react";
import { cn } from "@/lib/utils";

/** A category-appropriate icon for the placeholder, chosen from a slug or name hint. */
function PlaceholderIcon({ hint }: { hint: string }) {
  const p = { className: "size-10 sm:size-12", strokeWidth: 1.2, "aria-hidden": true } as const;
  if (/phone|mobile/.test(hint)) return <Smartphone {...p} />;
  if (/laptop|computer|notebook/.test(hint)) return <Laptop {...p} />;
  if (/tablet|ipad/.test(hint)) return <Tablet {...p} />;
  if (/audio|headphone|earbud|speaker|sound/.test(hint)) return <Headphones {...p} />;
  if (/watch|wearable/.test(hint)) return <Watch {...p} />;
  if (/gam(e|ing)|console/.test(hint)) return <Gamepad2 {...p} />;
  if (/accessor|charger|cable|power/.test(hint)) return <Cable {...p} />;
  return <Package {...p} />;
}

/**
 * Product photo, or a neutral placeholder when none has been uploaded yet —
 * we never show stock imagery that might misrepresent the actual item.
 */
export function ProductImage({
  src,
  alt,
  hint = "",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  className,
}: {
  src: string | null;
  alt: string;
  hint?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface via-card to-surface text-muted/60",
          className,
        )}
        role="img"
        aria-label={`${alt} (photo coming soon)`}
      >
        <span className="flex size-20 items-center justify-center rounded-full bg-card shadow-card ring-1 ring-line sm:size-24">
          <PlaceholderIcon hint={hint.toLowerCase()} />
        </span>
        <span className="text-[11px] font-medium tracking-wide">Photo coming soon</span>
      </div>
    );
  }
  return (
    <div className="h-full w-full bg-media">
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-contain p-4", className)} />
    </div>
  );
}
