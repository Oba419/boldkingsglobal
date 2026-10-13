import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getServerEnv } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const env = getServerEnv();
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, max: env.DATABASE_POOL_MAX });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Cached on globalThis in every environment: in development it survives hot
// reloads, and in production it stops each separately bundled module graph
// (pages, route handlers) from opening its own connection pool.
export const db: PrismaClient = (globalForPrisma.prisma ??= createClient());

export type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
