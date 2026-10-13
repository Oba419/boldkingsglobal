import "server-only";
import { cache } from "react";
import { db } from "../db";
import { audit } from "../audit";
import { decimalToKobo, koboToDecimalString } from "@/lib/money";
import { SITE } from "@/lib/site";
import type { SettingsInput } from "@/schemas/admin";
import type { PaymentOptionDTO, StoreSettingsDTO } from "@/types/settings";
import { getPaymentProvider } from "../payments";

type SettingsRow = NonNullable<Awaited<ReturnType<typeof db.storeSettings.findUnique>>>;

function toDTO(row: SettingsRow): StoreSettingsDTO {
  return {
    businessName: row.businessName,
    phonePrimary: row.phonePrimary,
    phoneSecondary: row.phoneSecondary,
    whatsappNumber: row.whatsappNumber,
    supportEmail: row.supportEmail,
    address: row.address,
    currency: row.currency,
    deliveryFeeKobo: row.deliveryFee ? decimalToKobo(row.deliveryFee) : null,
    deliveryNotes: row.deliveryNotes,
    payOnDeliveryEnabled: row.payOnDeliveryEnabled,
    bankTransferEnabled: row.bankTransferEnabled && !!row.bankName && !!row.bankAccountName && !!row.bankAccountNumber,
    bankName: row.bankName,
    bankAccountName: row.bankAccountName,
    bankAccountNumber: row.bankAccountNumber,
    announcementEnabled: row.announcementEnabled,
    announcementText: row.announcementText,
  };
}

/** Reads the singleton settings row, creating it from brand defaults if missing. */
export async function loadSettings(): Promise<StoreSettingsDTO> {
  const row = await db.storeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: SITE.name,
      phonePrimary: SITE.phonePrimary,
      phoneSecondary: SITE.phoneSecondary,
      whatsappNumber: SITE.phonePrimary,
    },
  });
  return toDTO(row);
}

/** Per-request memoised settings for server components. */
export const getSettings = cache(loadSettings);

export async function updateSettings(input: SettingsInput, actorId: string): Promise<StoreSettingsDTO> {
  const data = {
    ...input,
    deliveryFee: input.deliveryFee === null ? null : koboToDecimalString(input.deliveryFee),
  };
  const row = await db.$transaction(async (tx) => {
    const updated = await tx.storeSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    await audit({ actorId, action: "settings.update", entityType: "StoreSettings", entityId: "1", details: { fields: Object.keys(input) } }, tx);
    return updated;
  });
  return toDTO(row);
}

/** Payment options actually available to customers right now. */
export function availablePaymentOptions(settings: StoreSettingsDTO): PaymentOptionDTO[] {
  const options: PaymentOptionDTO[] = [];
  if (getPaymentProvider()) {
    options.push({
      method: "PAYSTACK",
      label: "Pay online (card, bank transfer, USSD)",
      description: "You'll be redirected to Paystack's secure page. Your order is marked paid only after Paystack confirms the payment.",
    });
  }
  if (settings.payOnDeliveryEnabled) {
    options.push({
      method: "PAY_ON_DELIVERY",
      label: "Pay on delivery",
      description: "Pay when your order arrives. Our team will call to confirm your order before dispatch.",
    });
  }
  if (settings.bankTransferEnabled) {
    options.push({
      method: "BANK_TRANSFER",
      label: "Bank transfer",
      description: `Transfer to ${settings.bankName} — ${settings.bankAccountName}. We confirm your payment manually before dispatch.`,
    });
  }
  return options;
}
