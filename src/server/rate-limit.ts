import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { Errors } from "./http";

/**
 * Fixed-window rate limiter backed by PostgreSQL, so limits are shared by all
 * server instances. The key is hashed so raw IPs/emails are not stored.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; retryAfter: number }> {
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const hashed = createHash("sha256").update(key).digest("hex");
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${hashed}, 1, ${windowStart})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" = EXCLUDED."windowStart" THEN "RateLimit"."count" + 1 ELSE 1 END,
      "windowStart" = EXCLUDED."windowStart"
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  const retryAfter = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);
  return { allowed: count <= limit, retryAfter };
}

/** Throws a 429 ApiError when the limit is exceeded. */
export async function enforceRateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const result = await rateLimit(key, limit, windowSeconds);
  if (!result.allowed) throw Errors.rateLimited(result.retryAfter);
}
