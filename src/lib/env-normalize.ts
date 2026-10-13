/**
 * Tolerant reading of hosting environment variables. Values pasted into a
 * dashboard often carry stray whitespace or the quotes from a .env example,
 * and database integrations use several variable names. This module cleans
 * that up before validation. It never logs or returns secret values for display.
 */

type Env = Record<string, string | undefined>;

/** Trims whitespace and one pair of matching surrounding quotes; empty becomes undefined. */
export function cleanEnvValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let v = value.trim();
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[v.length - 1] === v[0]) v = v.slice(1, -1).trim();
  return v === "" ? undefined : v;
}

const isPostgresUrl = (v: string) => /^postgres(ql)?:\/\//.test(v);

/**
 * Connection string for the running app. DATABASE_URL wins, then the names
 * set by Vercel's Postgres/Neon integrations. Prefers a value that looks like
 * a PostgreSQL URL; otherwise returns the first one set so validation can
 * report it as invalid.
 */
export function resolveDatabaseUrl(env: Env): string | undefined {
  const values = [env.DATABASE_URL, env.POSTGRES_PRISMA_URL, env.POSTGRES_URL, env.DATABASE_URL_UNPOOLED, env.POSTGRES_URL_NON_POOLING]
    .map(cleanEnvValue)
    .filter((v): v is string => v !== undefined);
  return values.find(isPostgresUrl) ?? values[0];
}

/** Connection string for migrations: a direct (non-pooled) URL when available. */
export function resolveMigrationUrl(env: Env): string | undefined {
  const values = [env.DIRECT_DATABASE_URL, env.DATABASE_URL_UNPOOLED, env.POSTGRES_URL_NON_POOLING]
    .map(cleanEnvValue)
    .filter((v): v is string => v !== undefined && isPostgresUrl(v));
  return values[0] ?? resolveDatabaseUrl(env);
}

/** A copy of the environment with the app's variables cleaned and resolved. */
export function normalizeEnv(env: Env): Env {
  return {
    ...env,
    DATABASE_URL: resolveDatabaseUrl(env),
    DATABASE_POOL_MAX: cleanEnvValue(env.DATABASE_POOL_MAX),
    SESSION_SECRET: cleanEnvValue(env.SESSION_SECRET),
    PAYSTACK_SECRET_KEY: cleanEnvValue(env.PAYSTACK_SECRET_KEY),
    APP_URL: cleanEnvValue(env.APP_URL),
  };
}
