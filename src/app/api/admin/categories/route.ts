import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { createCategory, listCategoriesAdmin } from "@/server/services/admin-categories";
import { categoryInputSchema } from "@/schemas/admin";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdminApi();
  return ok(await listCategoriesAdmin());
});

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const input = categoryInputSchema.parse(await readJson(req));
  const category = await createCategory(input, admin.id);
  return ok({ id: category.id }, { status: 201 });
});
