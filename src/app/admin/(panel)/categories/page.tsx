import type { Metadata } from "next";
import { listCategoriesAdmin } from "@/server/services/admin-categories";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesAdmin();
  return (
    <>
      <PageHeader title="Categories" description="Hiding a category hides all of its products from the store without changing them." />
      <CategoryManager categories={categories} />
    </>
  );
}
