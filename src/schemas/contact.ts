import { z } from "zod";
import { isNigerianMobile } from "@/lib/phone";

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(120),
    email: z
      .union([z.literal(""), z.email("Enter a valid email address").max(200)])
      .optional()
      .transform((v) => (v ? v.toLowerCase() : undefined)),
    phone: z
      .union([z.literal(""), z.string().trim().refine(isNigerianMobile, "Enter a valid Nigerian mobile number")])
      .optional()
      .transform((v) => (v ? v : undefined)),
    subject: z.string().trim().min(3, "Enter a subject").max(150),
    message: z.string().trim().min(10, "Your message should be at least 10 characters").max(3000),
    /** Honeypot — real visitors never see or fill this field. */
    website: z.string().max(0, "Spam detected").optional(),
  })
  .refine((v) => v.email || v.phone, {
    message: "Provide a phone number or an email address so we can reply",
    path: ["phone"],
  });

export type ContactFormValues = z.input<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email address").max(200).transform((v) => v.toLowerCase()),
  website: z.string().max(0).optional(),
});
