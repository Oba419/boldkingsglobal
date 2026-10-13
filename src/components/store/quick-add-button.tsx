"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-context";

export function QuickAddButton({ variantId, name }: { variantId: string; name: string }) {
  const router = useRouter();
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  // Briefly show a tick after adding.
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      // Sits above the card's stretched link.
      className={cn(
        "group/add relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 active:scale-90",
        added ? "bg-success text-white dark:text-navy-950" : "bg-primary text-primary-fg hover:scale-105 hover:bg-gold-gradient hover:text-navy-950 hover:shadow-glow",
      )}
      aria-label={`Add ${name} to cart`}
      onClick={() => {
        add(variantId, 1);
        setAdded(true);
        toast.success("Added to cart", {
          description: name,
          action: { label: "View cart", onClick: () => router.push("/cart") },
        });
      }}
    >
      {added ? <Check className="size-4 animate-pop" aria-hidden /> : <Plus className="size-4 transition-transform duration-300 group-hover/add:rotate-90" aria-hidden />}
    </button>
  );
}
