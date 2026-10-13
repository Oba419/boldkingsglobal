import { assertSameOrigin, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { requireUserApi } from "@/server/auth/session";
import { changePassword } from "@/server/services/users";
import { passwordChangeSchema } from "@/schemas/auth";

export const dynamic = "force-dynamic";

/** POST /api/account/password { currentPassword, newPassword, confirmPassword } — signs out other devices. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const user = await requireUserApi();
  await enforceRateLimit(`account:${user.id}`, 10, 900);
  const input = passwordChangeSchema.parse(await readJson(req, 5_000));
  await changePassword(user.id, input);
  return ok({ changed: true });
});
