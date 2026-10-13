import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { SITE } from "@/lib/site";

/** Two-panel layout for sign-in and registration: brand panel + form card. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="grid w-full max-w-5xl animate-fade-up overflow-hidden rounded-3xl border border-line bg-card shadow-lift lg:grid-cols-2">
        <div className="relative isolate hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-white lg:flex">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -left-10 -z-10 size-72 rounded-full bg-gold-500/20 blur-3xl" aria-hidden />
          <div className="relative aspect-[432/292] w-full animate-float overflow-hidden rounded-2xl ring-1 ring-gold-500/30 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.7)]">
            <Image src="/images/brand/crest.jpg" alt={`${SITE.name} crest`} fill sizes="440px" className="object-cover" />
          </div>
          <div className="space-y-4">
            <p className="font-display text-2xl font-bold text-gold-gradient">Welcome to {SITE.name}</p>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {["Track every order in one place", "Your cart follows you across devices", "Faster checkout next time"].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <BadgeCheck className="size-4 text-gold-400" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-7 sm:p-10">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
