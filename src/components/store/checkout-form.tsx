"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { api, ApiClientError, applyFieldErrors, errorMessage } from "@/lib/api-client";
import { formatNaira } from "@/lib/money";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { cn } from "@/lib/utils";
import { checkoutFormSchema } from "@/schemas/checkout";
import type { CreateOrderResult } from "@/types/order";
import type { PaymentOptionDTO } from "@/types/settings";
import { useCart } from "./cart-context";
import { OrderSummary } from "./cart-view";
import { useValidatedCart } from "./use-validated-cart";
import { ProductImage } from "./product-image";

type FormIn = z.input<typeof checkoutFormSchema>;
type FormOut = z.output<typeof checkoutFormSchema>;

function newKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutForm({
  paymentOptions,
  prefill,
  bank,
}: {
  paymentOptions: PaymentOptionDTO[];
  prefill: { fullName: string; email: string } | null;
  bank: { bankName: string; accountName: string; accountNumber: string } | null;
}) {
  const router = useRouter();
  const { lines, ready, clear } = useCart();
  const { cart, error: cartError, loading } = useValidatedCart(lines, ready);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // One idempotency key per distinct cart: a retried submission (double
  // click, flaky network) replays the same order instead of duplicating it.
  const cartKey = JSON.stringify(lines);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const idempotencyKey = useMemo(() => newKey(), [cartKey]);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      fullName: prefill?.fullName ?? "",
      email: prefill?.email ?? "",
      phone: "",
      state: "" as FormIn["state"],
      city: "",
      address: "",
      instructions: "",
      paymentMethod: paymentOptions.length === 1 ? paymentOptions[0]!.method : undefined,
    },
  });
  const method = useWatch({ control, name: "paymentMethod" });

  async function onSubmit(values: FormOut) {
    if (!cart || cart.hasIssues) return;
    if (values.paymentMethod === "PAYSTACK" && !values.email) {
      setError("email", { message: "Enter your email address — Paystack sends your receipt there" });
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await api<CreateOrderResult>("/api/orders", {
        body: { ...values, idempotencyKey, items: cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })) },
      });
      clear();
      if (result.paymentRedirectUrl) {
        window.location.assign(result.paymentRedirectUrl);
        return;
      }
      const params = new URLSearchParams({ token: result.accessToken });
      if (result.paymentError) params.set("payment", "error");
      router.push(`/order-confirmation/${result.reference}?${params}`);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiClientError && err.code === "INSUFFICIENT_STOCK") {
        setFormError(`${err.message} Go back to your cart to update it.`);
        return;
      }
      if (!applyFieldErrors(err, setError)) setFormError(errorMessage(err));
      else toast.error("Please check the highlighted fields.");
    }
  }

  if (!ready || (loading && !cart)) return (
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Loading checkout">
        <div className="space-y-6">
          <div className="skeleton h-56 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );

  if (!lines.length || !cart || !cart.lines.length) {
    return (
      <div className="card space-y-3 p-8 text-center">
        <p className="font-semibold">{cartError ?? "Your cart is empty."}</p>
        <Link href="/shop" className="btn-primary">
          Browse products
        </Link>
      </div>
    );
  }

  if (cart.hasIssues) {
    return (
      <div className="card space-y-3 p-8 text-center">
        <p className="font-semibold">Some items in your cart have changed.</p>
        <p className="text-sm text-muted">Please review availability and quantities before checking out.</p>
        <Link href="/cart" className="btn-primary">
          Review cart
        </Link>
      </div>
    );
  }

  const field = (name: keyof FormIn) => ({
    id: `checkout-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `checkout-${name}-error` : undefined,
  });
  const err = (name: keyof FormIn) =>
    errors[name]?.message ? (
      <p id={`checkout-${name}-error`} className="field-error">
        {errors[name]!.message}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <section className="card animate-fade-up space-y-5 p-6 sm:p-7" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-navy-950">1</span>
            Contact details
          </h2>
          {!prefill ? (
            <p className="text-sm text-muted">
              Have an account?{" "}
              <Link href="/account/login?next=/checkout" className="font-medium text-ink underline">
                Sign in
              </Link>{" "}
              to track orders easily. Guest checkout works too.
            </p>
          ) : null}
          <div>
            <label htmlFor="checkout-fullName" className="label">
              Full name
            </label>
            <input {...register("fullName")} {...field("fullName")} autoComplete="name" className="input" />
            {err("fullName")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="checkout-phone" className="label">
                Phone number
              </label>
              <input {...register("phone")} {...field("phone")} type="tel" autoComplete="tel" inputMode="tel" placeholder="08012345678" className="input" />
              {err("phone")}
            </div>
            <div>
              <label htmlFor="checkout-email" className="label">
                Email {method === "PAYSTACK" ? null : <span className="font-normal text-muted">(optional)</span>}
              </label>
              <input {...register("email")} {...field("email")} type="email" autoComplete="email" className="input" />
              {err("email")}
            </div>
          </div>
        </section>

        <section className="card animate-fade-up space-y-5 p-6 sm:p-7" aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-navy-950">2</span>
            Delivery address
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="checkout-state" className="label">
                State
              </label>
              <select {...register("state")} {...field("state")} autoComplete="address-level1" className="input">
                <option value="" disabled>
                  Select state
                </option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {err("state")}
            </div>
            <div>
              <label htmlFor="checkout-city" className="label">
                City / town
              </label>
              <input {...register("city")} {...field("city")} autoComplete="address-level2" className="input" />
              {err("city")}
            </div>
          </div>
          <div>
            <label htmlFor="checkout-address" className="label">
              Street address
            </label>
            <input {...register("address")} {...field("address")} autoComplete="street-address" placeholder="House number, street, area, nearest landmark" className="input" />
            {err("address")}
          </div>
          <div>
            <label htmlFor="checkout-instructions" className="label">
              Delivery instructions <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea {...register("instructions")} {...field("instructions")} rows={2} className="input" />
            {err("instructions")}
          </div>
        </section>

        <section className="card animate-fade-up space-y-5 p-6 sm:p-7" aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-navy-950">3</span>
            Payment
          </h2>
          <fieldset aria-describedby={errors.paymentMethod ? "checkout-paymentMethod-error" : undefined}>
            <legend className="sr-only">Payment method</legend>
            <div className="space-y-3">
              {paymentOptions.map((o) => (
                <label
                  key={o.method}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-all duration-200",
                    method === o.method ? "border-gold-500 bg-gold-500/[0.06] ring-4 ring-gold-500/15" : "border-line hover:border-gold-500/50",
                  )}
                >
                  <input type="radio" value={o.method} {...register("paymentMethod")} className="mt-1 size-4 accent-gold-500" />
                  <span>
                    <span className="block font-medium">{o.label}</span>
                    <span className="block text-sm text-muted">{o.description}</span>
                  </span>
                </label>
              ))}
            </div>
            {err("paymentMethod")}
          </fieldset>
          {method === "BANK_TRANSFER" && bank ? (
            <p className="animate-fade-up rounded-xl border border-gold-500/25 bg-gold-500/[0.06] p-4 text-sm">
              After placing your order, transfer the total to <strong>{bank.bankName}</strong>, account <strong>{bank.accountNumber}</strong> ({bank.accountName}), using your order reference as the narration.
            </p>
          ) : null}
        </section>
      </div>

      <OrderSummary cart={cart}>
        <ul className="max-h-64 space-y-3 overflow-y-auto border-t border-line pt-4">
          {cart.lines.map((l) => (
            <li key={l.variantId} className="flex gap-3 text-sm">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-line">
                <ProductImage src={l.image} alt="" sizes="48px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1">{l.name}</span>
                <span className="text-muted">
                  {l.quantity} × {formatNaira(l.unitPriceKobo)}
                  {l.variantName ? ` · ${l.variantName}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {formError ? (
          <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <button type="submit" className="btn-gold h-12 w-full text-[15px]" disabled={submitting || loading}>
          <Lock className="size-4" aria-hidden />
          {submitting ? "Placing order…" : method === "PAYSTACK" ? `Pay ${formatNaira(cart.totalKobo)}` : "Place order"}
        </button>
        <p className="text-xs text-muted">Prices and stock are confirmed by our system when you place the order.</p>
      </OrderSummary>
    </form>
  );
}
