import Link from "next/link";
import { AlertTriangle, Banknote, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { getDashboardSummary } from "@/server/services/dashboard";
import { formatNaira } from "@/lib/money";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-rules";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyRow, PageHeader, Panel } from "@/components/admin/ui";

export default async function AdminDashboardPage() {
  const s = await getDashboardSummary();
  const stats = [
    { icon: TrendingUp, label: "Paid sales (30 days)", value: formatNaira(s.sales30Kobo), note: `${s.sales30Count} paid order${s.sales30Count === 1 ? "" : "s"}` },
    { icon: Banknote, label: "Paid sales (all time)", value: formatNaira(s.salesAllKobo), note: `${s.salesAllCount} paid order${s.salesAllCount === 1 ? "" : "s"}` },
    { icon: Clock, label: "Pending orders", value: String(s.pendingOrders), note: `${s.totalOrders} orders in total`, href: "/admin/orders?status=PENDING" },
    { icon: CheckCircle2, label: "Delivered orders", value: String(s.completedOrders), note: `${s.totalProducts} products listed`, href: "/admin/orders?status=DELIVERED" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Sales count only orders marked Paid that were not cancelled." />

      {s.newEnquiries > 0 ? (
        <Link href="/admin/enquiries?status=NEW" className="mb-6 flex items-center gap-2 rounded-xl bg-warn-bg p-4 text-sm font-medium text-warn hover:underline">
          <AlertTriangle className="size-4" aria-hidden />
          {s.newEnquiries} new customer enquir{s.newEnquiries === 1 ? "y" : "ies"} waiting for a reply
        </Link>
      ) : null}

      <ul className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((st, i) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted">{st.label}</p>
                <span className="flex size-10 items-center justify-center rounded-xl bg-gold-gradient text-navy-950 shadow-[0_6px_18px_-8px_rgb(214_168_79/0.8)]">
                  <st.icon className="size-5" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{st.value}</p>
              <p className="mt-1 text-xs text-muted">{st.note}</p>
            </>
          );
          return (
            <li key={st.label} className="card relative animate-fade-up overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-gold-500/10 blur-2xl" aria-hidden />
              {st.href ? (
                <Link href={st.href} className="block hover:opacity-80">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Recent orders"
          actions={
            <Link href="/admin/orders" className="text-sm font-medium underline">
              View all
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-surface/70 text-left text-[11px] tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Order</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {s.recentOrders.length ? (
                  s.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/orders/${o.id}`} className="font-mono font-medium underline">
                          {o.reference}
                        </Link>
                        <p className="text-xs text-muted">{formatDate(o.createdAt, true)}</p>
                      </td>
                      <td className="px-4 py-2.5">{o.customerName}</td>
                      <td className="px-4 py-2.5 font-medium">{formatNaira(o.totalKobo)}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge kind="order" value={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge kind="payment" value={o.paymentStatus} label={PAYMENT_STATUS_LABELS[o.paymentStatus]} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={5}>No orders yet.</EmptyRow>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Low stock"
          actions={
            <Link href="/admin/products?status=low-stock" className="text-sm font-medium underline">
              View all
            </Link>
          }
        >
          {s.lowStock.length ? (
            <ul className="divide-y divide-line text-sm">
              {s.lowStock.map((v) => (
                <li key={v.variantId} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <Link href={`/admin/products/${v.productId}`} className="min-w-0 hover:underline">
                    <span className="block truncate font-medium">{v.productName}</span>
                    <span className="block text-xs text-muted">
                      {v.variantName === "Standard" ? v.sku : `${v.variantName} · ${v.sku}`}
                    </span>
                  </Link>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.stock === 0 ? "bg-danger-bg text-danger" : "bg-warn-bg text-warn"}`}>
                    {v.stock === 0 ? "Out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">All active products are well stocked.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
