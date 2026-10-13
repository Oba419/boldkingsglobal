import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { addOrderNote } from "@/server/services/admin-orders";
import { orderNoteSchema } from "@/schemas/admin";

export const dynamic = "force-dynamic";

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const { body } = orderNoteSchema.parse(await readJson(req));
  const note = await addOrderNote((await params).id, body, admin.id);
  return ok({ id: note.id }, { status: 201 });
});
