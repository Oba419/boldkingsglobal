import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { PasswordForm, ProfileForm } from "@/components/account-forms";

export const metadata: Metadata = { title: "My account" };

export default async function AdminAccountPage() {
  const admin = await requireAdminPage();
  return (
    <>
      <PageHeader title="My account" description="Your administrator sign-in details." />
      <div className="grid max-w-5xl gap-6 xl:grid-cols-2">
        <ProfileForm initial={{ name: admin.name, email: admin.email }} />
        <PasswordForm />
      </div>
    </>
  );
}
