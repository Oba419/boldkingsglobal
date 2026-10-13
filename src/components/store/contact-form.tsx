"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import type { z } from "zod";
import { api, applyFieldErrors, errorMessage } from "@/lib/api-client";
import { contactSchema } from "@/schemas/contact";

type In = z.input<typeof contactSchema>;
type Out = z.output<typeof contactSchema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "", website: "" },
  });

  async function onSubmit(values: Out) {
    setFormError(null);
    try {
      await api("/api/contact", { body: values });
      reset();
      setSent(true);
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(errorMessage(err));
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <p className="font-semibold">Message sent — thank you.</p>
        <p className="text-sm text-muted">We&apos;ll reply by phone or email as soon as we can.</p>
        <button type="button" className="btn-outline btn-sm" onClick={() => setSent(false)}>
          Send another message
        </button>
      </div>
    );
  }

  const fieldProps = (name: keyof In) => ({
    id: `contact-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });
  const fieldError = (name: keyof In) =>
    errors[name]?.message ? (
      <p id={`contact-${name}-error`} className="field-error">
        {errors[name]!.message}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="label">
          Your name
        </label>
        <input {...register("name")} {...fieldProps("name")} autoComplete="name" className="input" />
        {fieldError("name")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className="label">
            Phone
          </label>
          <input {...register("phone")} {...fieldProps("phone")} type="tel" autoComplete="tel" className="input" />
          {fieldError("phone")}
        </div>
        <div>
          <label htmlFor="contact-email" className="label">
            Email
          </label>
          <input {...register("email")} {...fieldProps("email")} type="email" autoComplete="email" className="input" />
          {fieldError("email")}
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted">Give us at least one way to reply.</p>
      <div>
        <label htmlFor="contact-subject" className="label">
          Subject
        </label>
        <input {...register("subject")} {...fieldProps("subject")} className="input" />
        {fieldError("subject")}
      </div>
      <div>
        <label htmlFor="contact-message" className="label">
          Message
        </label>
        <textarea {...register("message")} {...fieldProps("message")} rows={5} className="input" />
        {fieldError("message")}
      </div>
      <input {...register("website")} type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {formError ? (
        <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
