import Image from "next/image";
import { cn } from "@/lib/utils";

/** The Bold Kings Global crest with an engraved-serif wordmark. */
export function Logo({ size = "md", showText = true, className }: { size?: "sm" | "md" | "lg"; showText?: boolean; className?: string }) {
  const crest = { sm: "h-8 w-12", md: "h-10 w-[60px]", lg: "h-16 w-24" }[size];
  return (
    <span className={cn("group/logo flex items-center gap-3", className)}>
      <span className={cn("relative shrink-0 overflow-hidden rounded-lg ring-1 ring-gold-500/30 shadow-[0_4px_18px_-6px_rgb(214_168_79/0.6)] transition-transform duration-500 group-hover/logo:scale-105", crest)}>
        <Image src="/images/brand/crest.jpg" alt="" fill sizes="96px" className="object-cover" priority />
      </span>
      {showText ? (
        <span className="font-display leading-none">
          <span className={cn("block font-bold tracking-[0.08em] text-gold-gradient", size === "lg" ? "text-2xl" : "text-[15px] sm:text-base")}>BOLD KINGS</span>
          <span className={cn("mt-1 block font-semibold tracking-[0.42em] text-slate-300", size === "lg" ? "text-xs" : "text-[9px]")}>GLOBAL</span>
        </span>
      ) : null}
    </span>
  );
}
