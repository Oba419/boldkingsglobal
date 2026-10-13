import type { Kobo } from "@/lib/money";

/** Public store settings — safe to send to the browser. Never contains secrets. */
export type StoreSettingsDTO = {
  businessName: string;
  phonePrimary: string;
  phoneSecondary: string | null;
  whatsappNumber: string | null;
  supportEmail: string | null;
  address: string | null;
  currency: string;
  deliveryFeeKobo: Kobo | null;
  deliveryNotes: string | null;
  payOnDeliveryEnabled: boolean;
  bankTransferEnabled: boolean;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  announcementEnabled: boolean;
  announcementText: string | null;
};

export type PaymentOptionDTO = {
  method: "PAY_ON_DELIVERY" | "BANK_TRANSFER" | "PAYSTACK";
  label: string;
  description: string;
};
