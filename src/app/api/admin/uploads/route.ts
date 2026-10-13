import { assertSameOrigin, Errors, ok, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { MAX_UPLOAD_BYTES, saveUpload } from "@/server/uploads";
import { audit } from "@/server/audit";

export const dynamic = "force-dynamic";

/** POST /api/admin/uploads (multipart, field "file") → { path: "/uploads/…" } */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 100_000) throw Errors.validation("Images must be 5 MB or smaller");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw Errors.validation("Attach an image file");
  const path = await saveUpload(file);
  await audit({ actorId: admin.id, action: "upload.create", entityType: "Upload", entityId: path });
  return ok({ path }, { status: 201 });
});
