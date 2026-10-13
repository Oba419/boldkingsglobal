import type { Metadata } from "next";
import Link from "next/link";
import { listOrdersAdmin } from "@/server/services/admin-orders";
import { formatNaira } from "@/lib/money";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-rules";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyRow, PageHeader, Pager, Panel, qs } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Orders" };

type Props = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listOrdersAdmin({ q: sp.q, status: sp.status, page });

  return (
    <>
      <PageHeader title="Orders" description={`${data.total} order${data.total === 1 ? "" : "s"}`} />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="orders-q" className="sr-only">
          Search orders
        </label>
        <input id="orders-q" name="q" defaultValue={sp.q} placeholder="Reference, name, phone or email" className="input max-w-xs" />
        <label htmlFor="orders-status" className="sr-only">
          Status
        </label>
        <select id="orders-status" name="status" defaultValue={sp.status ?? ""} className="input w-auto">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {sp.q || sp.status ? (
          <Link href="/admin/orders" className="btn-ghost">
            Clear
          </Link>
        ) : null}
      </form>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-surface/70 text-left text-[11px] tracking-wider text-muted uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Items</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.orders.length ? (
                data.orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-surface/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono font-medium underline">
                        {o.reference}
                      </Link>
                      <p className="text-xs text-muted">{formatDate(o.createdAt, true)}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p>{o.customerName}</p>
                      <p className="text-xs text-muted">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-2.5">{o.itemCount}</td>
                    <td className="px-4 py-2.5 font-medium">{formatNaira(o.totalKobo)}</td>
                    <td className="px-4 py-2.5 text-xs">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge kind="order" value={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge kind="payment" value={o.paymentStatus} label={PAYMENT_STATUS_LABELS[o.paymentStatus]} />
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={7}>No orders match.</EmptyRow>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      <Pager page={data.page} pageCount={data.pageCount} href={(p) => `/admin/orders${qs({ q: sp.q, status: sp.status, page: p })}`} />
    </>
  );
}
