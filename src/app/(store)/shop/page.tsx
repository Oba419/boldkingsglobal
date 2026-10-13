import type { Metadata } from "next";
import { CatalogView } from "@/components/store/catalog-view";
import { listBrands, listCategories, listProducts } from "@/server/services/catalog";
import { parseCatalogQuery } from "@/schemas/catalog";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseCatalogQuery(await searchParams);
  return {
    title: query.q ? `Search: ${query.q}` : "Shop all products",
    alternates: { canonical: "/shop" },
    // Filtered and search result pages should not compete with category pages in search engines.
    robots: query.q || query.brand.length || query.page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const query = parseCatalogQuery(await searchParams);
  const [result, brands, categories] = await Promise.all([listProducts(query), listBrands(query.category), listCategories()]);
  return (
    <CatalogView
      title="All products"
      description="Browse our full range of phones, laptops, gadgets and accessories."
      basePath="/shop"
      query={query}
      result={result}
      brands={brands}
      categories={categories}
    />
  );
}
