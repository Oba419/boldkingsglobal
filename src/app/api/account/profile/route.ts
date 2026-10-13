import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { requireUserApi } from "@/server/auth/session";
import { updateProfile } from "@/server/services/users";
import { profileUpdateSchema } from "@/schemas/auth";

export const dynamic = "force-dynamic";

/** PATCH /api/account/profile { name, email, currentPassword } — update the signed-in user's details. */
export const PATCH = route(async (req) => {
  assertSameOrigin(req);
  const user = await requireUserApi();
  await enforceRateLimit(`account:${user.id}`, 10, 900);
  const input = profileUpdateSchema.parse(await readJson(req, 5_000));
  return ok(await updateProfile(user.id, input));
});
