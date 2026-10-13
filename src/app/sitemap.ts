import type { MetadataRoute } from "next";
import { appUrl } from "@/server/env";
import { listSitemapEntries } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await listSitemapEntries();
  const staticPages = ["/", "/shop", "/contact", "/about", "/delivery-returns", "/privacy"].map((p) => ({ url: appUrl(p) }));
  return [
    ...staticPages,
    ...categories.map((c) => ({ url: appUrl(`/category/${c.slug}`), lastModified: c.updatedAt })),
    ...products.map((p) => ({ url: appUrl(`/product/${p.slug}`), lastModified: p.updatedAt })),
  ];
}
