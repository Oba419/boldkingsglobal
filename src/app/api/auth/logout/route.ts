import { assertSameOrigin, ok, route } from "@/server/http";
import { destroySession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  await destroySession();
  return ok({ signedOut: true });
});
