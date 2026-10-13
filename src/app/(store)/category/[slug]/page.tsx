import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/store/catalog-view";
import { getCategoryBySlug, listBrands, listProducts } from "@/server/services/catalog";
import { parseCatalogQuery } from "@/schemas/catalog";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} at the best naira prices.`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const query = { ...parseCatalogQuery(await searchParams), category: category.slug };
  const [result, brands] = await Promise.all([listProducts(query), listBrands(category.slug)]);
  return (
    <CatalogView
      title={category.name}
      description={category.description}
      basePath={`/category/${category.slug}`}
      query={query}
      result={result}
      brands={brands}
    />
  );
}
