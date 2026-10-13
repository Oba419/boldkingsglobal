import "server-only";
import { z } from "zod";
import { resolveSiteUrl } from "@/lib/site-url";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required" })
    .min(1, "DATABASE_URL is required")
    .refine((v) => v.startsWith("postgres://") || v.startsWith("postgresql://"), "DATABASE_URL must be a PostgreSQL connection string"),
  /** Optional cap on pooled connections (small Postgres plans, serverless hosts). */
  DATABASE_POOL_MAX: z.preprocess((v) => (v === "" || v === undefined ? undefined : v), z.coerce.number().int().min(1).max(100).optional()),
  // Falls back to the Vercel production domain, so payment callbacks work even if APP_URL is unset.
  APP_URL: z.preprocess(() => resolveSiteUrl(), z.url()),
  SESSION_SECRET: z
    .string({ error: "SESSION_SECRET is required" })
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .refine((v) => !v.startsWith("replace-with"), "SESSION_SECRET still has the placeholder value from .env.example"),
  PAYSTACK_SECRET_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .refine((v) => v === undefined || /^sk_(test|live)_[A-Za-z0-9]+$/.test(v), "PAYSTACK_SECRET_KEY must look like sk_test_… or sk_live_…"),
});

export type ServerEnv = z.output<typeof envSchema>;

let cached: ServerEnv | undefined;

/** Validates environment variables once and returns them. Throws a readable error on misconfiguration. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${details}\nSee .env.example for the required variables.`);
  }
  cached = result.data;
  return cached;
}

export function appUrl(path = ""): string {
  return new URL(path, getServerEnv().APP_URL).toString();
}
