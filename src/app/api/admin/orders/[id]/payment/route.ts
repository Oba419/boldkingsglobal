import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { recordPaymentStatus } from "@/server/services/admin-orders";
import { paymentStatusUpdateSchema } from "@/schemas/admin";
import type { PaymentStatusValue } from "@/lib/order-rules";

export const dynamic = "force-dynamic";

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const { paymentStatus } = paymentStatusUpdateSchema.parse(await readJson(req));
  const order = await recordPaymentStatus((await params).id, paymentStatus as PaymentStatusValue, admin.id);
  return ok({ paymentStatus: order.paymentStatus });
});
