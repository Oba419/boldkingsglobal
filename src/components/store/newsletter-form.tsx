"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";

export function NewsletterForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    try {
      await api("/api/newsletter", { body: { email: String(form.get("email") ?? ""), website: String(form.get("website") ?? "") } });
      setDone(true);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="flex animate-fade-up items-center gap-2 text-sm text-gold-300" role="status">
        <CheckCircle2 className="size-5" aria-hidden /> Thanks — you&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full lg:justify-self-end">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex w-full max-w-md gap-2 rounded-full border border-white/10 bg-white/[0.05] p-1.5 backdrop-blur transition-colors focus-within:border-gold-500/50 lg:ml-auto">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-10 min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button type="submit" className="btn-gold min-h-10 rounded-full px-5" disabled={pending}>
          {pending ? "Joining…" : "Subscribe"}
        </button>
      </div>
      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
    </form>
  );
}
