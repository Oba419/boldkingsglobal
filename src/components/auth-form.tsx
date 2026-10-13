"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, applyFieldErrors, errorMessage } from "@/lib/api-client";
import { loginSchema, registerSchema, type RegisterValues } from "@/schemas/auth";
import { safeNext } from "@/lib/utils";


type Mode = "login" | "register" | "admin";

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const isRegister = mode === "register";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    // Login only uses email + password; the register schema adds name.
    resolver: zodResolver((isRegister ? registerSchema : loginSchema) as typeof registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      const body = isRegister ? values : { email: values.email, password: values.password };
      const { user } = await api<{ user: { role: "ADMIN" | "CUSTOMER" } }>(isRegister ? "/api/auth/register" : "/api/auth/login", { body });
      if (mode === "admin" && user.role !== "ADMIN") {
        await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        setFormError("This account does not have administrator access.");
        return;
      }
      router.replace(safeNext(next, mode === "admin" || user.role === "ADMIN" ? "/admin" : "/account"));
      router.refresh();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) setFormError(errorMessage(err));
    }
  }

  const describe = (name: keyof RegisterValues) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${mode}-${name}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {isRegister ? (
        <div>
          <label htmlFor={`${mode}-name`} className="label">
            Full name
          </label>
          <input id={`${mode}-name`} {...register("name")} {...describe("name")} autoComplete="name" className="input" />
          {errors.name ? (
            <p id={`${mode}-name-error`} className="field-error">
              {errors.name.message}
            </p>
          ) : null}
        </div>
      ) : null}
      <div>
        <label htmlFor={`${mode}-email`} className="label">
          Email
        </label>
        <input id={`${mode}-email`} type="email" {...register("email")} {...describe("email")} autoComplete="email" className="input" />
        {errors.email ? (
          <p id={`${mode}-email-error`} className="field-error">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor={`${mode}-password`} className="label">
          Password
        </label>
        <input
          id={`${mode}-password`}
          type="password"
          {...register("password")}
          {...describe("password")}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="input"
        />
        {errors.password ? (
          <p id={`${mode}-password-error`} className="field-error">
            {errors.password.message}
          </p>
        ) : isRegister ? (
          <p className="mt-1.5 text-xs text-muted">At least 10 characters, including a letter and a number.</p>
        ) : null}
      </div>
      {formError ? (
        <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      <button type="submit" className="btn-gold h-12 w-full text-[15px]" disabled={isSubmitting}>
        {isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
      </button>
      {mode === "login" ? (
        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link href={next ? `/account/register?next=${encodeURIComponent(next)}` : "/account/register"} className="font-medium text-ink underline">
            Create an account
          </Link>
        </p>
      ) : mode === "register" ? (
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href={next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login"} className="font-medium text-ink underline">
            Sign in
          </Link>
        </p>
      ) : null}
    </form>
  );
}

export function LogoutButton({ className = "btn-outline", redirectTo = "/" }: { className?: string; redirectTo?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        router.replace(redirectTo);
        router.refresh();
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
