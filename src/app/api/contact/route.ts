import { assertSameOrigin, clientIp, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { createEnquiry } from "@/server/services/contact";
import { contactSchema } from "@/schemas/contact";

export const dynamic = "force-dynamic";

/** POST /api/contact — stores an enquiry in the database for staff to follow up. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  await enforceRateLimit(`contact:${clientIp(req)}`, 5, 600);
  const input = contactSchema.parse(await readJson(req, 20_000));
  const enquiry = await createEnquiry(input);
  return ok({ id: enquiry.id }, { status: 201 });
});
