/**
 * Creates (or promotes / resets) an administrator account.
 *
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… npm run admin:create
 *
 * Public registration only ever creates customers, so this script is the one
 * way to provision admin access. Remove the variables from the environment
 * once the account exists.
 */
import { z } from "zod";
import { hashPassword } from "../src/server/auth/password";
import { passwordSchema } from "../src/schemas/auth";
import { createScriptClient } from "./prisma-client";

const envSchema = z.object({
  ADMIN_EMAIL: z.email("ADMIN_EMAIL must be a valid email address").transform((v) => v.toLowerCase().trim()),
  ADMIN_PASSWORD: passwordSchema,
  ADMIN_NAME: z.string().trim().min(2, "ADMIN_NAME is required").max(120),
});

async function main() {
  const input = envSchema.safeParse(process.env);
  if (!input.success) {
    console.error("Cannot create admin:\n" + input.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name } = input.data;
  const db = createScriptClient();
  try {
    const passwordHash = await hashPassword(password);
    const existing = await db.user.findUnique({ where: { email } });
    await db.user.upsert({
      where: { email },
      update: { name, passwordHash, role: "ADMIN", isActive: true },
      create: { email, name, passwordHash, role: "ADMIN" },
    });
    if (existing) {
      // A password reset should end any sessions opened with the old password.
      await db.session.deleteMany({ where: { userId: existing.id } });
    }
    await db.auditLog.create({
      data: { action: existing ? "admin.reset" : "admin.create", entityType: "User", entityId: email, details: { via: "cli" } },
    });
    console.log(existing ? `Updated ${email}: role ADMIN, password reset, sessions signed out.` : `Created administrator ${email}.`);
    console.log("Sign in at /admin/login. Now remove ADMIN_PASSWORD from your environment.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
