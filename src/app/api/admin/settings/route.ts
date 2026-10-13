import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { loadSettings, updateSettings } from "@/server/services/settings";
import { settingsInputSchema } from "@/schemas/admin";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdminApi();
  return ok(await loadSettings());
});

export const PUT = route(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdminApi();
  const input = settingsInputSchema.parse(await readJson(req));
  return ok(await updateSettings(input, admin.id));
});
