import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { listEnquiries } from "@/server/services/contact";
import { telHref } from "@/lib/phone";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/admin/ui";
import { EnquiryStatusSelect } from "@/components/admin/enquiry-status-select";

export const metadata: Metadata = { title: "Enquiries" };

const TABS = [
  { value: "", label: "All" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
];

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const enquiries = await listEnquiries(status || undefined);

  return (
    <>
      <PageHeader title="Enquiries" description="Messages sent through the contact form (most recent 100)." />
      <nav aria-label="Filter enquiries" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value ? `/admin/enquiries?status=${t.value}` : "/admin/enquiries"}
            aria-current={status === t.value ? "page" : undefined}
            className={status === t.value ? "btn-primary btn-sm" : "btn-outline btn-sm"}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {enquiries.length ? (
        <ul className="space-y-3">
          {enquiries.map((e) => (
            <li key={e.id} className="card p-5">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{e.subject}</p>
                  <p className="text-sm text-muted">
                    {e.name} · {formatDate(e.createdAt, true)}
                  </p>
                </div>
                <EnquiryStatusSelect id={e.id} status={e.status} />
              </div>
              <p className="text-sm whitespace-pre-line text-ink/80">{e.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {e.phone ? (
                  <a href={telHref(e.phone)} className="btn-outline btn-sm">
                    <Phone className="size-3.5" aria-hidden /> {e.phone}
                  </a>
                ) : null}
                {e.email ? (
                  <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${e.subject}`)}`} className="btn-outline btn-sm">
                    <Mail className="size-3.5" aria-hidden /> {e.email}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card p-10 text-center text-muted">No enquiries here.</div>
      )}
    </>
  );
}
