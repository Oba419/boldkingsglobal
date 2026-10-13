import { assertSameOrigin, clientIp, ok, readJson, route } from "@/server/http";
import { ApiError } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { createSession } from "@/server/auth/session";
import { authenticate } from "@/server/services/users";
import { loginSchema } from "@/schemas/auth";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const { email, password } = loginSchema.parse(await readJson(req, 5_000));
  await enforceRateLimit(`login-ip:${clientIp(req)}`, 20, 900);
  await enforceRateLimit(`login-email:${email}`, 10, 900);
  const user = await authenticate(email, password);
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Incorrect email or password.");
  await createSession(user.id, req.headers.get("user-agent"));
  return ok({ user: { name: user.name, email: user.email, role: user.role } });
});
