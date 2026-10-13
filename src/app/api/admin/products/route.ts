import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { createProduct, listProductsAdmin } from "@/server/services/admin-products";
import { productInputSchema } from "@/schemas/admin";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireAdminApi();
  const url = new URL(req.url);
  return ok(
    await listProductsAdmin({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1) || 1,
    }),
  );
});

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const input = productInputSchema.parse(await readJson(req, 200_000));
  const product = await createProduct(input, admin.id);
  return ok({ id: product.id, slug: product.slug }, { status: 201 });
});
