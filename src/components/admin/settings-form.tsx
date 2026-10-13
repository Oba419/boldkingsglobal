"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, applyFieldErrors, errorMessage } from "@/lib/api-client";
import { settingsInputSchema, type SettingsFormValues, type SettingsInput } from "@/schemas/admin";

export function SettingsForm({ initial, paystackConfigured }: { initial: SettingsFormValues; paystackConfigured: boolean }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues, unknown, SettingsInput>({ resolver: zodResolver(settingsInputSchema), defaultValues: initial });

  async function onValid() {
    setFormError(null);
    const body = getValues();
    try {
      await api("/api/admin/settings", { method: "PUT", body });
      reset(body);
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(errorMessage(err));
    }
  }

  const text = (name: keyof SettingsFormValues, label: string, opts: { hint?: string; type?: string; optional?: boolean; mono?: boolean } = {}) => (
    <div>
      <label htmlFor={`s-${name}`} className="label">
        {label} {opts.optional ? <span className="font-normal text-muted">(optional)</span> : null}
      </label>
      <input id={`s-${name}`} type={opts.type ?? "text"} className={`input ${opts.mono ? "font-mono" : ""}`} {...register(name)} aria-invalid={errors[name] ? true : undefined} />
      {opts.hint ? <p className="mt-1 text-xs text-muted">{opts.hint}</p> : null}
      {errors[name]?.message ? <p className="field-error">{errors[name]!.message}</p> : null}
    </div>
  );

  const [payOnDelivery, bankTransfer] = useWatch({ control, name: ["payOnDeliveryEnabled", "bankTransferEnabled"] });
  const anyPayment = paystackConfigured || payOnDelivery || bankTransfer;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="max-w-3xl space-y-6">
      <section className="card animate-fade-up space-y-4 p-6">
        <h2 className="font-semibold">Business details</h2>
        {text("businessName", "Business name")}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("phonePrimary", "Main phone", { type: "tel" })}
          {text("phoneSecondary", "Second phone", { type: "tel", optional: true })}
          {text("whatsappNumber", "WhatsApp number", { type: "tel", optional: true, hint: "Used for all WhatsApp buttons. Leave empty to hide them." })}
          {text("supportEmail", "Support email", { type: "email", optional: true })}
        </div>
        {text("address", "Address", { optional: true })}
      </section>

      <section className="card animate-fade-up space-y-4 p-6">
        <h2 className="font-semibold">Delivery</h2>
        {text("deliveryFee", "Flat delivery fee (₦)", {
          optional: true,
          hint: "Added to every order. Enter 0 for free delivery, or leave empty if you'll agree the cost with each customer after ordering.",
        })}
        <div>
          <label htmlFor="s-deliveryNotes" className="label">
            Delivery notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea id="s-deliveryNotes" rows={3} className="input" {...register("deliveryNotes")} placeholder="e.g. Lagos: 1–2 working days. Other states: 3–5 working days." />
          {errors.deliveryNotes ? <p className="field-error">{errors.deliveryNotes.message}</p> : null}
        </div>
      </section>

      <section className="card animate-fade-up space-y-4 p-6">
        <h2 className="font-semibold">Payment options</h2>
        <div className="flex items-start gap-2 rounded-xl bg-surface p-3 text-sm">
          {paystackConfigured ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <XCircle className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />}
          <p>
            <strong>Online payment (Paystack):</strong>{" "}
            {paystackConfigured ? "configured and offered at checkout." : "not configured. Set PAYSTACK_SECRET_KEY on the server to enable it."}
          </p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-gold-500" {...register("payOnDeliveryEnabled")} />
          <span>
            <span className="font-medium">Pay on delivery</span>
            <span className="block text-xs text-muted">Customers pay when the order arrives. Mark orders paid manually once collected.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-gold-500" {...register("bankTransferEnabled")} />
          <span>
            <span className="font-medium">Bank transfer</span>
            <span className="block text-xs text-muted">Customers see these account details after ordering. Confirm receipt before marking orders paid.</span>
          </span>
        </label>
        {errors.bankTransferEnabled ? <p className="field-error">{errors.bankTransferEnabled.message}</p> : null}
        <div className="grid gap-4 sm:grid-cols-3">
          {text("bankName", "Bank name", { optional: true })}
          {text("bankAccountName", "Account name", { optional: true })}
          {text("bankAccountNumber", "Account number", { optional: true, mono: true })}
        </div>
        {!anyPayment ? <p className="rounded-xl bg-warn-bg p-3 text-sm text-warn">No payment option is enabled — customers will not be able to check out.</p> : null}
      </section>

      <section className="card animate-fade-up space-y-4 p-6">
        <h2 className="font-semibold">Announcement bar</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-gold-500" {...register("announcementEnabled")} /> Show an announcement at the top of every store page
        </label>
        {text("announcementText", "Announcement text", { optional: true })}
      </section>

      {formError ? (
        <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving…" : "Save settings"}
        </button>
        {!isDirty ? <span className="text-sm text-muted">No unsaved changes</span> : null}
      </div>
    </form>
  );
}
