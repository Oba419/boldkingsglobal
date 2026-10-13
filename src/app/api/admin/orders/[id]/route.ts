import { Errors, ok, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { getOrderAdmin } from "@/server/services/admin-orders";

export const dynamic = "force-dynamic";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  await requireAdminApi();
  const order = await getOrderAdmin((await params).id);
  if (!order) throw Errors.notFound("Order not found");
  return ok(order);
});
