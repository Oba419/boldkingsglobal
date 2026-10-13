/**
 * The site's public base URL, resolved without throwing so it is safe to use
 * at build time. Order: APP_URL, then Vercel's production domain, then
 * localhost. A bare host such as "example.com" gets https:// added.
 */
export function resolveSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const candidates = [env.APP_URL, env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      // Malformed — try the next candidate.
    }
  }
  return "http://localhost:3000";
}
