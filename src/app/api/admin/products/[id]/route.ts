import { assertSameOrigin, Errors, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { deleteProduct, getProductAdmin, updateProduct } from "@/server/services/admin-products";
import { productInputSchema } from "@/schemas/admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdminApi();
  const product = await getProductAdmin((await params).id);
  if (!product) throw Errors.notFound("Product not found");
  return ok(product);
});

export const PUT = route<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const input = productInputSchema.parse(await readJson(req, 200_000));
  const product = await updateProduct((await params).id, input, admin.id);
  return ok({ id: product.id, slug: product.slug });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  await deleteProduct((await params).id, admin.id);
  return ok({ deleted: true });
});
