import { z } from "zod";
import { ApiError, assertSameOrigin, clientIp, Errors, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { getCurrentUser } from "@/server/auth/session";
import { getOrderForViewer, startOnlinePayment } from "@/server/services/orders";

export const dynamic = "force-dynamic";

/** POST /api/orders/:reference/pay — start (or retry) online payment for an authorised viewer. */
export const POST = route<{ params: Promise<{ reference: string }> }>(async (req, { params }) => {
  assertSameOrigin(req);
  await enforceRateLimit(`pay:${clientIp(req)}`, 10, 600);
  const { reference } = await params;
  const { token } = z.object({ token: z.string().max(100).optional() }).parse(await readJson(req));
  const order = await getOrderForViewer(reference, token, await getCurrentUser());
  if (!order) throw Errors.notFound("Order not found");
  const result = await startOnlinePayment(order.id);
  if (!result.authorizationUrl) throw new ApiError(400, "PAYMENT_UNAVAILABLE", result.error ?? "Online payment is unavailable.");
  return ok({ authorizationUrl: result.authorizationUrl });
});
