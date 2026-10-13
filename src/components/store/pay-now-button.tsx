"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";

export function PayNowButton({ reference, token }: { reference: string; token: string | null }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="btn-gold"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const { authorizationUrl } = await api<{ authorizationUrl: string }>(`/api/orders/${encodeURIComponent(reference)}/pay`, {
            body: token ? { token } : {},
          });
          window.location.assign(authorizationUrl);
        } catch (err) {
          toast.error(errorMessage(err));
          setPending(false);
        }
      }}
    >
      <CreditCard className="size-4" aria-hidden />
      {pending ? "Opening Paystack…" : "Pay now"}
    </button>
  );
}
