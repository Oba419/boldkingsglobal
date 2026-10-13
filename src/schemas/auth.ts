import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").max(200).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Enter your password").max(200),
});

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email address").max(200).transform((v) => v.toLowerCase().trim()),
  password: passwordSchema,
});

export type LoginValues = z.input<typeof loginSchema>;
export type RegisterValues = z.input<typeof registerSchema>;

/** Changing name or email requires the current password, so a stolen session alone can't take over the account. */
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email address").max(200).transform((v) => v.toLowerCase().trim()),
  currentPassword: z.string().min(1, "Enter your current password to confirm").max(200),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string().max(200),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "The passwords don't match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a password different from your current one" });

export type ProfileUpdateValues = z.input<typeof profileUpdateSchema>;
export type PasswordChangeValues = z.input<typeof passwordChangeSchema>;
