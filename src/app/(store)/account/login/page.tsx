import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/store/auth-shell";
import { safeNext } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next, "/account"));
  return (
    <AuthShell title="Sign in" subtitle="Track your orders and check out faster.">
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
