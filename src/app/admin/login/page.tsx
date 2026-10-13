import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/auth/session";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-brand-gradient p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" aria-hidden />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -z-10 size-[480px] -translate-x-1/2 animate-glow rounded-full bg-gold-500/20 blur-[110px]" aria-hidden />
      <div className="w-full max-w-md animate-fade-up space-y-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative aspect-[432/292] w-44 overflow-hidden rounded-2xl ring-1 ring-gold-500/40 shadow-[0_24px_60px_-20px_rgb(214_168_79/0.55)]">
            <Image src="/images/brand/crest.jpg" alt={`${SITE.name} crest`} fill priority sizes="176px" className="object-cover" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-wider text-gold-gradient">BOLD KINGS GLOBAL</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs tracking-[0.2em] text-slate-400 uppercase">
              <ShieldCheck className="size-3.5 text-gold-400" aria-hidden /> Admin console
            </p>
          </div>
        </div>
        <div className="card space-y-5 p-7">
          <h1 className="text-xl font-bold">Sign in to continue</h1>
          {error === "forbidden" || user ? (
            <p className="rounded-xl bg-warn-bg p-3 text-sm text-warn">You are signed in as a customer. Sign in with an administrator account to continue.</p>
          ) : null}
          <AuthForm mode="admin" next="/admin" />
        </div>
        <p className="text-center text-sm">
          <Link href="/" className="text-slate-400 transition-colors hover:text-gold-300">
            ← Back to the store
          </Link>
        </p>
      </div>
    </div>
  );
}
