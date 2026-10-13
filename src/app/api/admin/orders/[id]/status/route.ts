import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { updateOrderStatus } from "@/server/services/admin-orders";
import { orderStatusUpdateSchema } from "@/schemas/admin";
import type { OrderStatusValue } from "@/lib/order-rules";

export const dynamic = "force-dynamic";

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const { status } = orderStatusUpdateSchema.parse(await readJson(req));
  const order = await updateOrderStatus((await params).id, status as OrderStatusValue, admin.id);
  return ok({ status: order.status });
});
