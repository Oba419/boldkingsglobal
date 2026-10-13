import { requireAdminPage } from "@/server/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[240px_1fr]">
      <AdminNav adminName={admin.name} />
      <main className="min-w-0 animate-fade-in p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
