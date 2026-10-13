import { assertSameOrigin, clientIp, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { createSession } from "@/server/auth/session";
import { registerCustomer } from "@/server/services/users";
import { registerSchema } from "@/schemas/auth";

export const dynamic = "force-dynamic";

/** Customer self-registration. Always creates a CUSTOMER — admin accounts are provisioned via `npm run admin:create`. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  await enforceRateLimit(`register:${clientIp(req)}`, 5, 3600);
  const input = registerSchema.parse(await readJson(req, 5_000));
  const user = await registerCustomer(input);
  await createSession(user.id, req.headers.get("user-agent"));
  return ok({ user: { name: user.name, email: user.email, role: user.role } }, { status: 201 });
});
