import { assertSameOrigin, clientIp, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { getCurrentUser } from "@/server/auth/session";
import { createOrder } from "@/server/services/orders";
import { createOrderSchema } from "@/schemas/checkout";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders — place an order.
 * The body contains only customer/delivery details, payment method, an
 * idempotency key, and { variantId, quantity } lines. Prices are never read
 * from the request.
 */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  await enforceRateLimit(`order:${clientIp(req)}`, 20, 600);
  const input = createOrderSchema.parse(await readJson(req));
  const user = await getCurrentUser();
  const result = await createOrder(input, { userId: user?.id ?? null });
  return ok(result, { status: result.replayed ? 200 : 201 });
});
