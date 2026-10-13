"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";

export function ProductRowActions({ id, slug, archived, visible }: { id: string; slug: string; archived: boolean; visible: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function act(fn: () => Promise<unknown>, success: string) {
    setPending(true);
    try {
      await fn();
      toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex flex-wrap justify-end gap-1">
      <Link href={`/admin/products/${id}`} className="btn-ghost btn-sm">
        Edit
      </Link>
      {visible ? (
        <Link href={`/product/${slug}`} target="_blank" className="btn-ghost btn-sm">
          View
        </Link>
      ) : null}
      <button
        type="button"
        className="btn-ghost btn-sm"
        disabled={pending}
        onClick={() => {
          if (!archived && !confirm("Archive this product? It will be hidden from the store but kept for order history.")) return;
          act(() => api(`/api/admin/products/${id}/archive`, { body: { archived: !archived } }), archived ? "Product restored (hidden until you activate it)" : "Product archived");
        }}
      >
        {archived ? "Restore" : "Archive"}
      </button>
      {archived ? (
        <button
          type="button"
          className="btn-ghost btn-sm text-danger"
          disabled={pending}
          onClick={() => {
            if (!confirm("Permanently delete this product? This cannot be undone. Products that appear in past orders cannot be deleted.")) return;
            act(() => api(`/api/admin/products/${id}`, { method: "DELETE" }), "Product deleted");
          }}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}
