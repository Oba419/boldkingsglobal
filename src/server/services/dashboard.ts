import "server-only";
import { db } from "../db";
import { decimalToKobo } from "@/lib/money";
import { LOW_STOCK_THRESHOLD } from "@/lib/order-rules";

/**
 * Sales definition: the sum of order totals where paymentStatus = PAID and
 * the order is not CANCELLED. Unpaid, failed, refunded and cancelled orders
 * never count as revenue.
 */
export async function getDashboardSummary() {
  const now = Date.now();
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const paidWhere = { paymentStatus: "PAID" as const, status: { not: "CANCELLED" as const } };

  const [totalOrders, pendingOrders, completedOrders, totalProducts, lowStock, recent, paid30, paidAll, newEnquiries] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.product.count({ where: { archivedAt: null } }),
    db.productVariant.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD }, product: { archivedAt: null, isActive: true } },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.order.aggregate({ where: { ...paidWhere, createdAt: { gte: since30 } }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: paidWhere, _sum: { total: true }, _count: true }),
    db.contactEnquiry.count({ where: { status: "NEW" } }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalProducts,
    newEnquiries,
    sales30Kobo: paid30._sum.total ? decimalToKobo(paid30._sum.total) : 0,
    sales30Count: paid30._count,
    salesAllKobo: paidAll._sum.total ? decimalToKobo(paidAll._sum.total) : 0,
    salesAllCount: paidAll._count,
    lowStock: lowStock.map((v) => ({ variantId: v.id, productId: v.product.id, productName: v.product.name, variantName: v.name, sku: v.sku, stock: v.stock })),
    recentOrders: recent.map((o) => ({
      id: o.id,
      reference: o.reference,
      customerName: o.customerName,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalKobo: decimalToKobo(o.total),
      createdAt: o.createdAt.toISOString(),
    })),
  };
}
