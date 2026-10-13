import "server-only";
import { db } from "../db";
import { Errors, isUniqueConstraintError } from "../http";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../auth/password";

/** Verifies credentials. Timing is kept uniform whether or not the email exists. */
export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.isActive) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Public registration always creates CUSTOMER accounts — never admins. */
export async function registerCustomer(input: { name: string; email: string; password: string }) {
  try {
    const user = await db.user.create({
      data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password), role: "CUSTOMER" },
    });
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  } catch (err) {
    if (isUniqueConstraintError(err)) throw Errors.conflict("An account with this email already exists. Try signing in.", { field: "email" });
    throw err;
  }
}
