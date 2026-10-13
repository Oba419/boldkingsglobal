import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { deleteCategory, updateCategory } from "@/server/services/admin-categories";
import { categoryInputSchema } from "@/schemas/admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const input = categoryInputSchema.parse(await readJson(req));
  const category = await updateCategory((await params).id, input, admin.id);
  return ok({ id: category.id });
});

export const DELETE = route<Ctx>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  await deleteCategory((await params).id, admin.id);
  return ok({ deleted: true });
});
