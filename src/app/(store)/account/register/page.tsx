import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/store/auth-shell";
import { safeNext } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next, "/account"));
  return (
    <AuthShell title="Create an account" subtitle="Save your cart across devices and see all your orders in one place.">
      <AuthForm mode="register" next={next} />
    </AuthShell>
  );
}
