import "server-only";
import { db } from "../db";
import { Errors, isUniqueConstraintError } from "../http";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../auth/password";
import { revokeOtherSessions } from "../auth/session";
import { audit } from "../audit";

/** Verifies credentials. Timing is kept uniform whether or not the email exists. */
export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.isActive) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function requireCurrentPassword(userId: string, currentPassword: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw Errors.unauthenticated();
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw Errors.validation("Your current password is incorrect", { currentPassword: ["Your current password is incorrect"] });
  }
  return user;
}

/** Updates the signed-in user's name and email after re-checking their password. */
export async function updateProfile(userId: string, input: { name: string; email: string; currentPassword: string }) {
  const user = await requireCurrentPassword(userId, input.currentPassword);
  try {
    const updated = await db.$transaction(async (tx) => {
      const row = await tx.user.update({ where: { id: userId }, data: { name: input.name, email: input.email } });
      await audit(
        {
          actorId: userId,
          action: "account.profile",
          entityType: "User",
          entityId: userId,
          details: { nameChanged: user.name !== input.name, emailChanged: user.email !== input.email },
        },
        tx,
      );
      return row;
    });
    return { name: updated.name, email: updated.email };
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw Errors.validation("Another account already uses this email", { email: ["Another account already uses this email"] });
    }
    throw err;
  }
}

/** Changes the password and signs out every other session for this user. */
export async function changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
  await requireCurrentPassword(userId, input.currentPassword);
  const passwordHash = await hashPassword(input.newPassword);
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await audit({ actorId: userId, action: "account.password", entityType: "User", entityId: userId }, tx);
  });
  await revokeOtherSessions(userId);
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
