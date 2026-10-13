import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { setVariantStock } from "@/server/services/inventory";
import { stockAdjustSchema } from "@/schemas/admin";

export const dynamic = "force-dynamic";

/** POST /api/admin/variants/:id/stock { stock, note } — set an absolute stock level. */
export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const { id } = await params;
  const body = stockAdjustSchema.parse({ ...(await readJson(req) as object), variantId: id });
  const stock = await setVariantStock(id, body.stock, admin.id, body.note);
  return ok({ stock });
});
