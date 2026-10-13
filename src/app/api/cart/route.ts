import { z } from "zod";
import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireUserApi } from "@/server/auth/session";
import { getUserCart, replaceUserCart } from "@/server/services/cart";
import { cartLinesSchema } from "@/schemas/checkout";

export const dynamic = "force-dynamic";

/** GET /api/cart — the signed-in customer's saved cart. */
export const GET = route(async () => {
  const user = await requireUserApi();
  return ok({ items: await getUserCart(user.id) });
});

/** PUT /api/cart — replace the signed-in customer's saved cart (used after merging a guest cart). */
export const PUT = route(async (req) => {
  assertSameOrigin(req);
  const user = await requireUserApi();
  const { items } = z.object({ items: cartLinesSchema }).parse(await readJson(req));
  return ok({ items: await replaceUserCart(user.id, items) });
});
