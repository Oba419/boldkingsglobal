import type { Metadata } from "next";
import Link from "next/link";
import { requireUserPage } from "@/server/auth/session";
import { listUserOrders } from "@/server/services/orders";
import { formatNaira } from "@/lib/money";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-rules";
import { formatDate } from "@/lib/utils";
import { LogoutButton } from "@/components/auth-form";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUserPage("/account");
  const orders = await listUserOrders(user.id);

  return (
    <div className="container-page animate-fade-up py-12">
      <div className="relative isolate mb-10 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" aria-hidden />
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-gold-gradient text-xl font-bold text-navy-950 shadow-glow">{user.name.charAt(0).toUpperCase()}</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Hello, <span className="text-gold-gradient">{user.name.split(" ")[0]}</span>
            </h1>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user.role === "ADMIN" ? (
            <Link href="/admin" className="btn-gold">
              Admin dashboard
            </Link>
          ) : null}
          <LogoutButton className="btn-outline-light" />
        </div>
      </div>

      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold"><span className="h-5 w-1 rounded-full bg-gold-gradient" aria-hidden />Your orders</h2>
      {orders.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface/70 text-left text-xs tracking-wider text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.reference} className="transition-colors hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link href={`/order-confirmation/${o.reference}`} className="font-mono font-medium underline">
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">{o.itemCount}</td>
                  <td className="px-4 py-3 font-medium">{formatNaira(o.totalKobo)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge kind="order" value={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge kind="payment" value={o.paymentStatus} label={PAYMENT_STATUS_LABELS[o.paymentStatus]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-muted">You haven&apos;t placed any orders with this account yet.</p>
          <Link href="/shop" className="btn-primary mt-4">
            Start shopping
          </Link>
        </div>
      )}
    </div>
  );
}
