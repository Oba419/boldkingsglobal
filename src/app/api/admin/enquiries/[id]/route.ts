import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { updateEnquiryStatus } from "@/server/services/contact";
import { enquiryStatusSchema } from "@/schemas/admin";

export const dynamic = "force-dynamic";

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const { status } = enquiryStatusSchema.parse(await readJson(req));
  await updateEnquiryStatus((await params).id, status, admin.id);
  return ok({ status });
});
