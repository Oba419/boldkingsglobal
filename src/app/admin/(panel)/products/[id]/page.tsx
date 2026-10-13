import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProductAdmin } from "@/server/services/admin-products";
import { listCategoriesAdmin } from "@/server/services/admin-categories";
import { koboToInputValue } from "@/lib/money";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductAdmin(id), listCategoriesAdmin()]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All products
      </Link>
      <PageHeader
        title={product.name}
        description={product.archived ? "Archived — hidden from the store. Restore it from the product list." : product.orderCount ? `Appears in ${product.orderCount} order line${product.orderCount === 1 ? "" : "s"}.` : undefined}
        actions={
          product.isActive && !product.archived ? (
            <Link href={`/product/${product.slug}`} target="_blank" className="btn-outline btn-sm">
              View in store
            </Link>
          ) : null
        }
      />
      <ProductForm
        productId={product.id}
        categories={categories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive }))}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          brand: product.brand,
          sku: product.sku ?? "",
          categoryId: product.categoryId,
          price: koboToInputValue(product.priceKobo),
          compareAtPrice: koboToInputValue(product.compareAtKobo),
          images: product.images,
          specifications: product.specifications,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            priceOverride: koboToInputValue(v.priceOverrideKobo),
            stock: v.stock,
            isActive: v.isActive,
          })),
        }}
      />
    </>
  );
}
