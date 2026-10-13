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
