import type { Metadata } from "next";
import Link from "next/link";
import { listCategoriesAdmin } from "@/server/services/admin-categories";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const categories = await listCategoriesAdmin();
  if (!categories.length) {
    return (
      <>
        <PageHeader title="Add product" />
        <div className="card p-6">
          <p className="mb-3">Create a category first — every product belongs to one.</p>
          <Link href="/admin/categories" className="btn-primary">
            Go to categories
          </Link>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Add product" />
      <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))} />
    </>
  );
}
