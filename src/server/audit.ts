import "server-only";
import type { TxClient } from "./db";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";

export async function audit(
  entry: { actorId?: string | null; action: string; entityType: string; entityId: string; details?: Prisma.InputJsonValue },
  client: TxClient | typeof db = db,
): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
    },
  });
}
