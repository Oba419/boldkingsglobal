import "server-only";
import { db } from "../db";
import { Errors } from "../http";
import { audit } from "../audit";
import { restoreOrderInventory } from "./inventory";
import { decimalToKobo } from "@/lib/money";
import {
  canRecordPayment,
  canTransitionOrder,
  ORDER_STATUSES,
  type OrderStatusValue,
  type PaymentStatusValue,
} from "@/lib/order-rules";
import type { Prisma } from "@/generated/prisma/client";
import { toOrderDTO } from "./orders";

export const ADMIN_ORDERS_PAGE_SIZE = 20;

export async function listOrdersAdmin(params: { q?: string; status?: string; page?: number }) {
  const where: Prisma.OrderWhereInput = {};
  if (params.status && (ORDER_STATUSES as string[]).includes(params.status)) where.status = params.status as OrderStatusValue;
  const q = params.q?.trim().slice(0, 100);
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerPhone: { contains: q.replace(/\s/g, "") } },
      { customerEmail: { contains: q, mode: "insensitive" } },
    ];
  }
  const page = Math.max(1, params.page ?? 1);
  const [total, rows] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_ORDERS_PAGE_SIZE,
      take: ADMIN_ORDERS_PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
  ]);
  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_ORDERS_PAGE_SIZE)),
    orders: rows.map((o) => ({
      id: o.id,
      reference: o.reference,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      totalKobo: decimalToKobo(o.total),
      itemCount: o._count.items,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}

export async function getOrderAdmin(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!order) return null;
  const history = await db.auditLog.findMany({
    where: { entityType: "Order", entityId: id },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
    take: 50,
  });
  return {
    ...toOrderDTO(order),
    updatedAt: order.updatedAt.toISOString(),
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    inventoryRestored: order.inventoryRestored,
    account: order.user,
    notes: order.notes.map((n) => ({ id: n.id, body: n.body, author: n.author?.name ?? "System", createdAt: n.createdAt.toISOString() })),
    payments: order.payments.map((p) => ({
      id: p.id,
      provider: p.provider,
      reference: p.reference,
      amountKobo: decimalToKobo(p.amount),
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
    history: history.map((h) => ({
      id: h.id,
      action: h.action,
      actor: h.actor?.name ?? "System",
      details: h.details,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

/**
 * Moves an order through its lifecycle. The update is conditional on the
 * status we validated against, so two admins acting at once cannot apply
 * conflicting transitions. Cancellation restores reserved stock exactly once.
 */
export async function updateOrderStatus(orderId: string, to: OrderStatusValue, actorId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw Errors.notFound("Order not found");
    if (order.status === to) return order;
    if (!canTransitionOrder(order.status, to)) {
      throw Errors.conflict(`An order cannot move from ${order.status} to ${to}.`);
    }
    const now = new Date();
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: to,
        ...(to === "CANCELLED" ? { cancelledAt: now } : {}),
        ...(to === "DELIVERED" ? { deliveredAt: now } : {}),
      },
    });
    if (updated.count === 0) throw Errors.conflict("This order was updated by someone else. Refresh and try again.");

    if (to === "CANCELLED") {
      await restoreOrderInventory(tx, orderId, "ORDER_CANCELLED", actorId);
      await tx.paymentTransaction.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "ABANDONED" } });
    }
    await audit(
      {
        actorId,
        action: "order.status",
        entityType: "Order",
        entityId: orderId,
        details: { from: order.status, to, ...(to === "CANCELLED" && order.paymentStatus === "PAID" ? { refundRequired: true } : {}) },
      },
      tx,
    );
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

/** Records a manual payment status change (offline payments and refunds). */
export async function recordPaymentStatus(orderId: string, to: PaymentStatusValue, actorId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw Errors.notFound("Order not found");
    if (order.paymentStatus === to) return order;
    if (!canRecordPayment(order.paymentMethod, order.paymentStatus, to, order.status)) {
      throw Errors.conflict(
        order.paymentMethod === "PAYSTACK" && to === "PAID"
          ? "Online payments are confirmed automatically by Paystack verification and cannot be marked paid manually."
          : `Payment status cannot change from ${order.paymentStatus} to ${to}.`,
      );
    }
    const updated = await tx.order.updateMany({ where: { id: orderId, paymentStatus: order.paymentStatus }, data: { paymentStatus: to } });
    if (updated.count === 0) throw Errors.conflict("This order was updated by someone else. Refresh and try again.");
    await audit({ actorId, action: "order.payment", entityType: "Order", entityId: orderId, details: { from: order.paymentStatus, to } }, tx);
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

export async function addOrderNote(orderId: string, body: string, actorId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) throw Errors.notFound("Order not found");
  return db.orderNote.create({ data: { orderId, body, authorId: actorId } });
}
