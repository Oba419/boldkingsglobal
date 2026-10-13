"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api, applyFieldErrors, errorMessage } from "@/lib/api-client";
import { passwordChangeSchema, profileUpdateSchema, type PasswordChangeValues, type ProfileUpdateValues } from "@/schemas/auth";

function Field({
  id,
  label,
  error,
  hint,
  ...input
}: { id: string; label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...input} />
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function Section({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="card animate-fade-up overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-6 py-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gold-gradient text-navy-950">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function ProfileForm({ initial }: { initial: { name: string; email: string } }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { ...initial, currentPassword: "" },
  });

  async function onSubmit(values: ProfileUpdateValues) {
    setFormError(null);
    try {
      const saved = await api<{ name: string; email: string }>("/api/account/profile", { method: "PATCH", body: values });
      reset({ ...saved, currentPassword: "" });
      toast.success("Account details updated");
      router.refresh();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(errorMessage(err));
    }
  }

  return (
    <Section icon={UserRound} title="Profile" description="Your name and the email you sign in with.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field id="acct-name" label="Name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Field id="acct-email" label="Email" type="email" autoComplete="email" hint="You'll use this to sign in." error={errors.email?.message} {...register("email")} />
        <Field
          id="acct-current"
          label="Current password"
          type="password"
          autoComplete="current-password"
          hint="Required to confirm changes."
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        {formError ? (
          <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </Section>
  );
}

export function PasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: PasswordChangeValues) {
    setFormError(null);
    try {
      await api("/api/account/password", { body: values });
      reset();
      toast.success("Password changed", { description: "Other devices have been signed out." });
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(errorMessage(err));
    }
  }

  return (
    <Section icon={KeyRound} title="Password" description="Changing it signs you out on every other device.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field id="pw-current" label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
        <Field
          id="pw-new"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, including a letter and a number."
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Field id="pw-confirm" label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        {formError ? (
          <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <button type="submit" className="btn-gold" disabled={isSubmitting}>
          {isSubmitting ? "Changing…" : "Change password"}
        </button>
      </form>
    </Section>
  );
}
