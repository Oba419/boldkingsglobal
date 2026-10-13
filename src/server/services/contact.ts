import "server-only";
import { db } from "../db";
import { Errors, isUniqueConstraintError } from "../http";
import { audit } from "../audit";
import { toLocalNigerian } from "@/lib/phone";
import type { z } from "zod";
import type { contactSchema } from "@/schemas/contact";

type ContactInput = z.output<typeof contactSchema>;

/** Persists a contact enquiry. Staff review enquiries at /admin/enquiries. */
export async function createEnquiry(input: ContactInput) {
  return db.contactEnquiry.create({
    data: {
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ? (toLocalNigerian(input.phone) ?? input.phone) : null,
      subject: input.subject,
      message: input.message,
    },
    select: { id: true, createdAt: true },
  });
}

export async function listEnquiries(status?: string) {
  const where = status === "NEW" || status === "IN_PROGRESS" || status === "RESOLVED" ? { status: status as "NEW" | "IN_PROGRESS" | "RESOLVED" } : {};
  return db.contactEnquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function updateEnquiryStatus(id: string, status: "NEW" | "IN_PROGRESS" | "RESOLVED", actorId: string) {
  const existing = await db.contactEnquiry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw Errors.notFound("Enquiry not found");
  await db.$transaction(async (tx) => {
    await tx.contactEnquiry.update({ where: { id }, data: { status } });
    await audit({ actorId, action: "enquiry.status", entityType: "ContactEnquiry", entityId: id, details: { status } }, tx);
  });
}

/** Stores a newsletter subscription. Re-subscribing is a no-op. */
export async function subscribeNewsletter(email: string): Promise<void> {
  try {
    await db.newsletterSubscriber.create({ data: { email } });
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
  }
}
