import { z } from "zod";
import { isNigerianMobile } from "@/lib/phone";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { MAX_LINES_PER_ORDER, MAX_QUANTITY_PER_LINE } from "@/lib/order-rules";

export const quantitySchema = z
  .number({ error: "Quantity must be a number" })
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(MAX_QUANTITY_PER_LINE, `You can order at most ${MAX_QUANTITY_PER_LINE} of an item at once`);

export const cartLineInputSchema = z.object({
  variantId: z.string().trim().min(1).max(64),
  quantity: quantitySchema,
});

export const cartLinesSchema = z
  .array(cartLineInputSchema)
  .max(MAX_LINES_PER_ORDER, `An order can contain at most ${MAX_LINES_PER_ORDER} different items`);

export const phoneSchema = z
  .string()
  .trim()
  .refine(isNigerianMobile, "Enter a valid Nigerian mobile number, e.g. 08012345678");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const customerDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  phone: phoneSchema,
  email: z
    .union([z.literal(""), z.email("Enter a valid email address").max(200)])
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined)),
});

export const deliveryDetailsSchema = z.object({
  state: z.enum(NIGERIAN_STATES, { error: "Select your state" }),
  city: z.string().trim().min(2, "Enter your city or town").max(100),
  address: z.string().trim().min(5, "Enter your street address").max(300),
  instructions: optionalText(500),
});

export const paymentMethodSchema = z.enum(["PAY_ON_DELIVERY", "BANK_TRANSFER", "PAYSTACK"], {
  error: "Choose a payment method",
});

/** Fields the customer fills in on the checkout form. */
export const checkoutFormSchema = customerDetailsSchema.extend({
  state: deliveryDetailsSchema.shape.state,
  city: deliveryDetailsSchema.shape.city,
  address: deliveryDetailsSchema.shape.address,
  instructions: deliveryDetailsSchema.shape.instructions,
  paymentMethod: paymentMethodSchema,
});

/**
 * The order-creation request. Note what is *absent*: prices, totals, payment
 * status. Unknown keys are stripped, so a manipulated client cannot inject them.
 */
export const createOrderSchema = checkoutFormSchema.extend({
  idempotencyKey: z.string().trim().min(16).max(100).regex(/^[A-Za-z0-9-_]+$/),
  items: cartLinesSchema.min(1, "Your cart is empty"),
});

export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;
export type CreateOrderInput = z.output<typeof createOrderSchema>;
export type CartLineInput = z.output<typeof cartLineInputSchema>;
