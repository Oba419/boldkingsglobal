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
function getClient(): PrismaClient {
  return (globalForPrisma.prisma ??= createClient());
}

/**
 * Created lazily on first use, not at import: `next build` imports every route
 * to collect page data, and must not require database credentials to do so.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
