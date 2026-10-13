import { z } from "zod";
import { parseNairaToKobo } from "@/lib/money";
import { SKU_RE, SLUG_RE } from "@/lib/utils";
import { isNigerianMobile } from "@/lib/phone";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/order-rules";

/** A naira amount typed by an admin ("1,250,000" or "1250000.50") → kobo. */
const nairaAmount = (label: string) =>
  z
    .union([z.string(), z.number()])
    .transform((v, ctx) => {
      try {
        return parseNairaToKobo(String(v));
      } catch {
        ctx.addIssue({ code: "custom", message: `${label} must be a valid naira amount` });
        return z.NEVER;
      }
    });

const optionalNairaAmount = (label: string) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v, ctx) => {
      if (v === null || v === undefined || String(v).trim() === "") return null;
      try {
        return parseNairaToKobo(String(v));
      } catch {
        ctx.addIssue({ code: "custom", message: `${label} must be a valid naira amount` });
        return z.NEVER;
      }
    });

const imagePath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("/images/") || v.startsWith("/uploads/"), "Images must be uploaded files or paths under /images/");

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const specificationSchema = z.object({
  label: z.string().trim().min(1, "Label required").max(60),
  value: z.string().trim().min(1, "Value required").max(300),
});

export const variantInputSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(1, "Variant name required").max(80),
  sku: z.string().trim().toUpperCase().regex(SKU_RE, "SKU: 2–64 chars, letters, numbers, - or _"),
  priceOverride: optionalNairaAmount("Variant price"),
  stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").max(100000),
  isActive: z.boolean().default(true),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: z.string().trim().toLowerCase().regex(SLUG_RE, "Slug may contain lowercase letters, numbers and hyphens"),
    description: z.string().trim().min(10, "Add a description of at least 10 characters").max(5000),
    brand: z.string().trim().min(1).max(60),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || SKU_RE.test(v), "SKU: 2–64 chars, letters, numbers, - or _"),
    categoryId: z.string().min(1, "Choose a category").max(64),
    price: nairaAmount("Price"),
    compareAtPrice: optionalNairaAmount("Comparison price"),
    images: z.array(imagePath).max(8, "At most 8 images"),
    specifications: z.array(specificationSchema).max(40),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    variants: z.array(variantInputSchema).min(1, "A product needs at least one variant").max(30),
  })
  .superRefine((p, ctx) => {
    if (p.price <= 0) ctx.addIssue({ code: "custom", path: ["price"], message: "Price must be greater than zero" });
    if (p.compareAtPrice !== null && p.compareAtPrice <= p.price) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "Comparison price must be higher than the current price (leave empty if there is no genuine previous price)",
      });
    }
    const skus = new Set<string>();
    p.variants.forEach((v, i) => {
      if (skus.has(v.sku)) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "Duplicate variant SKU" });
      skus.add(v.sku);
      if (v.priceOverride !== null && v.priceOverride < p.price) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", i, "priceOverride"],
          message: "Variant price must be at least the base price (the base price is the 'from' price in listings)",
        });
      }
    });
  });

export type ProductInput = z.output<typeof productInputSchema>;
export type ProductFormValues = z.input<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(SLUG_RE, "Slug may contain lowercase letters, numbers and hyphens"),
  description: optionalString(500),
  image: z
    .union([imagePath, z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.boolean(),
});

export type CategoryInput = z.output<typeof categoryInputSchema>;
export type CategoryFormValues = z.input<typeof categoryInputSchema>;

export const stockAdjustSchema = z.object({
  variantId: z.string().min(1).max(64),
  /** The new absolute stock level. */
  stock: z.coerce.number().int().min(0).max(100000),
  note: optionalString(200),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES as [string, ...string[]]),
});

export const paymentStatusUpdateSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES as [string, ...string[]]),
});

export const orderNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

const optionalPhone = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isNigerianMobile(v), "Enter a valid Nigerian mobile number");

export const settingsInputSchema = z
  .object({
    businessName: z.string().trim().min(2).max(120),
    phonePrimary: z.string().trim().refine(isNigerianMobile, "Enter a valid Nigerian mobile number"),
    phoneSecondary: optionalPhone,
    whatsappNumber: optionalPhone,
    supportEmail: z
      .union([z.literal(""), z.email(), z.null()])
      .optional()
      .transform((v) => (v ? v.toLowerCase() : null)),
    address: optionalString(300),
    deliveryFee: optionalNairaAmount("Delivery fee"),
    deliveryNotes: optionalString(1000),
    payOnDeliveryEnabled: z.boolean(),
    bankTransferEnabled: z.boolean(),
    bankName: optionalString(100),
    bankAccountName: optionalString(150),
    bankAccountNumber: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^\d{10}$/.test(v), "Nigerian account numbers (NUBAN) have 10 digits"),
    announcementEnabled: z.boolean(),
    announcementText: optionalString(200),
  })
  .superRefine((s, ctx) => {
    if (s.bankTransferEnabled && (!s.bankName || !s.bankAccountName || !s.bankAccountNumber)) {
      ctx.addIssue({
        code: "custom",
        path: ["bankTransferEnabled"],
        message: "Enter the bank name, account name and account number before enabling bank transfer",
      });
    }
    if (s.announcementEnabled && !s.announcementText) {
      ctx.addIssue({ code: "custom", path: ["announcementText"], message: "Enter announcement text or disable the announcement" });
    }
  });

export type SettingsInput = z.output<typeof settingsInputSchema>;
export type SettingsFormValues = z.input<typeof settingsInputSchema>;

export const enquiryStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
});
