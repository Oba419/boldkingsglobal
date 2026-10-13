"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";

type Status = "NEW" | "IN_PROGRESS" | "RESOLVED";

export function EnquiryStatusSelect({ id, status }: { id: string; status: Status }) {
  const router = useRouter();
  const [value, setValue] = useState<Status>(status);
  const [pending, setPending] = useState(false);
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Status</span>
      <select
        className="input min-h-9 w-auto py-1"
        value={value}
        disabled={pending}
        onChange={async (e) => {
          const next = e.target.value as Status;
          const prev = value;
          setValue(next);
          setPending(true);
          try {
            await api(`/api/admin/enquiries/${id}`, { method: "PATCH", body: { status: next } });
            router.refresh();
          } catch (err) {
            setValue(prev);
            toast.error(errorMessage(err));
          } finally {
            setPending(false);
          }
        }}
      >
        <option value="NEW">New</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>
    </label>
  );
}
