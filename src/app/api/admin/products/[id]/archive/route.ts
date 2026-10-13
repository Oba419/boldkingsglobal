import { z } from "zod";
import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { setProductArchived } from "@/server/services/admin-products";

export const dynamic = "force-dynamic";

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const { archived } = z.object({ archived: z.boolean() }).parse(await readJson(req));
  await setProductArchived((await params).id, archived, admin.id);
  return ok({ archived });
});
