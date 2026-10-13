import type { Kobo } from "@/lib/money";
import type { OrderStatusValue, PaymentMethodValue, PaymentStatusValue } from "@/lib/order-rules";

export type OrderItemDTO = {
  id: string;
  productName: string;
  productSlug: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  unitPriceKobo: Kobo;
  quantity: number;
  lineTotalKobo: Kobo;
};

export type OrderDTO = {
  id: string;
  reference: string;
  status: OrderStatusValue;
  paymentStatus: PaymentStatusValue;
  paymentMethod: PaymentMethodValue;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryState: string;
  deliveryCity: string;
  deliveryAddress: string;
  deliveryInstructions: string | null;
  subtotalKobo: Kobo;
  deliveryFeeKobo: Kobo | null;
  totalKobo: Kobo;
  currency: string;
  createdAt: string;
  items: OrderItemDTO[];
};

export type ValidatedCartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  variantName: string | null;
  image: string | null;
  unitPriceKobo: Kobo;
  requestedQuantity: number;
  quantity: number;
  available: number;
  lineTotalKobo: Kobo;
  issue: null | "UNAVAILABLE" | "OUT_OF_STOCK" | "QUANTITY_REDUCED";
};

export type ValidatedCart = {
  lines: ValidatedCartLine[];
  subtotalKobo: Kobo;
  deliveryFeeKobo: Kobo | null;
  totalKobo: Kobo;
  hasIssues: boolean;
};

export type CreateOrderResult = {
  reference: string;
  accessToken: string;
  totalKobo: Kobo;
  paymentRedirectUrl: string | null;
  paymentError: string | null;
  replayed: boolean;
};
