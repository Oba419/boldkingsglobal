import { describe, expect, it } from "vitest";
import { cleanEnvValue, normalizeEnv, resolveDatabaseUrl, resolveMigrationUrl } from "@/lib/env-normalize";

const PG = "postgresql://u:p@ep-x.eu-west-2.aws.neon.tech/neondb?sslmode=require";
const PG_POOLED = "postgresql://u:p@ep-x-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

describe("cleanEnvValue", () => {
  it("strips whitespace and a pair of surrounding quotes", () => {
    expect(cleanEnvValue(`  "${PG}"  `)).toBe(PG);
    expect(cleanEnvValue(`'abc'`)).toBe("abc");
    expect(cleanEnvValue(`"unbalanced`)).toBe(`"unbalanced`);
  });

  it("treats empty values as unset", () => {
    expect(cleanEnvValue("")).toBeUndefined();
    expect(cleanEnvValue('  ""  ')).toBeUndefined();
    expect(cleanEnvValue(undefined)).toBeUndefined();
  });
});

describe("database URLs", () => {
  it("prefers DATABASE_URL, then integration names", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: PG_POOLED, POSTGRES_URL: PG })).toBe(PG_POOLED);
    expect(resolveDatabaseUrl({ POSTGRES_URL: PG })).toBe(PG);
    expect(resolveDatabaseUrl({ DATABASE_URL_UNPOOLED: PG })).toBe(PG);
  });

  it("skips a malformed DATABASE_URL when a valid alternative exists", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "not-a-url", POSTGRES_URL: PG })).toBe(PG);
    expect(resolveDatabaseUrl({ DATABASE_URL: "not-a-url" })).toBe("not-a-url");
  });

  it("uses a direct connection for migrations when available", () => {
    expect(resolveMigrationUrl({ DATABASE_URL: PG_POOLED, DATABASE_URL_UNPOOLED: PG })).toBe(PG);
    expect(resolveMigrationUrl({ DATABASE_URL: `"${PG_POOLED}"` })).toBe(PG_POOLED);
  });

  it("normalises the app's variables", () => {
    const env = normalizeEnv({ DATABASE_URL: ` "${PG}" `, SESSION_SECRET: "'x'.repeat", OTHER: "kept" });
    expect(env.DATABASE_URL).toBe(PG);
    expect(env.OTHER).toBe("kept");
  });
});
