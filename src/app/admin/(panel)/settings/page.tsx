import type { Metadata } from "next";
import { loadSettings } from "@/server/services/settings";
import { isOnlinePaymentConfigured } from "@/server/payments";
import { koboToInputValue } from "@/lib/money";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const s = await loadSettings();
  return (
    <>
      <PageHeader title="Store settings" description="Business details, delivery and payment options shown to customers." />
      <SettingsForm
        paystackConfigured={isOnlinePaymentConfigured()}
        initial={{
          businessName: s.businessName,
          phonePrimary: s.phonePrimary,
          phoneSecondary: s.phoneSecondary ?? "",
          whatsappNumber: s.whatsappNumber ?? "",
          supportEmail: s.supportEmail ?? "",
          address: s.address ?? "",
          deliveryFee: koboToInputValue(s.deliveryFeeKobo),
          deliveryNotes: s.deliveryNotes ?? "",
          payOnDeliveryEnabled: s.payOnDeliveryEnabled,
          bankTransferEnabled: s.bankTransferEnabled,
          bankName: s.bankName ?? "",
          bankAccountName: s.bankAccountName ?? "",
          bankAccountNumber: s.bankAccountNumber ?? "",
          announcementEnabled: s.announcementEnabled,
          announcementText: s.announcementText ?? "",
        }}
      />
    </>
  );
}
