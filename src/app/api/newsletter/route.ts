import { assertSameOrigin, clientIp, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { subscribeNewsletter } from "@/server/services/contact";
import { newsletterSchema } from "@/schemas/contact";

export const dynamic = "force-dynamic";

/** POST /api/newsletter — stores a subscriber email in the database. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  await enforceRateLimit(`newsletter:${clientIp(req)}`, 5, 600);
  const { email } = newsletterSchema.parse(await readJson(req, 2_000));
  await subscribeNewsletter(email);
  return ok({ subscribed: true }, { status: 201 });
});
