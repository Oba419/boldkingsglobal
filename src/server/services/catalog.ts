import "server-only";
import { db } from "../db";
import type { Prisma } from "@/generated/prisma/client";
import { decimalToKobo, koboToDecimalString } from "@/lib/money";
import { MAX_QUANTITY_PER_LINE } from "@/lib/order-rules";
import type { CatalogQuery } from "@/schemas/catalog";
import type { CategoryDTO, ProductCardDTO, ProductDetailDTO, ProductListResult, SpecificationDTO, VariantDTO } from "@/types/catalog";

export const PAGE_SIZE = 12;

/** Products customers may see: active, not archived, in an active category. */
export const visibleProductWhere: Prisma.ProductWhereInput = {
  isActive: true,
  archivedAt: null,
  category: { isActive: true },
};

const cardInclude = {
  category: { select: { name: true, slug: true, image: true } },
  variants: {
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, sku: true, priceOverride: true, stock: true, attributes: true },
  },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(p: CardRow): ProductCardDTO {
  const base = decimalToKobo(p.price);
  const variantPrices = p.variants.map((v) => (v.priceOverride ? decimalToKobo(v.priceOverride) : base));
  const inStockVariants = p.variants.filter((v) => v.stock > 0);
  const single = p.variants.length === 1 ? p.variants[0] : null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    image: p.images[0] ?? p.category.image ?? null,
    priceKobo: variantPrices.length ? Math.min(...variantPrices) : base,
    compareAtKobo: p.compareAtPrice ? decimalToKobo(p.compareAtPrice) : null,
    hasPriceRange: new Set(variantPrices).size > 1,
    inStock: inStockVariants.length > 0,
    quickAddVariantId: single && single.stock > 0 ? single.id : null,
    quickAddMaxQty: single ? Math.min(single.stock, MAX_QUANTITY_PER_LINE) : 0,
    category: { name: p.category.name, slug: p.category.slug },
  };
}

function parseSpecs(value: Prisma.JsonValue): SpecificationDTO[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((s) => {
    if (s && typeof s === "object" && !Array.isArray(s) && typeof s.label === "string" && typeof s.value === "string") {
      return [{ label: s.label, value: s.value }];
    }
    return [];
  });
}

function parseAttributes(value: Prisma.JsonValue | null): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) if (typeof v === "string") out[k] = v;
  return Object.keys(out).length ? out : null;
}

function searchWhere(q: string): Prisma.ProductWhereInput[] {
  const terms = q.split(/\s+/).filter(Boolean).slice(0, 6);
  return terms.map((term) => ({
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { brand: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { category: { name: { contains: term, mode: "insensitive" } } },
      { variants: { some: { isActive: true, OR: [{ sku: { contains: term, mode: "insensitive" } }, { name: { contains: term, mode: "insensitive" } }] } } },
    ],
  }));
}

export function buildProductWhere(query: CatalogQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [visibleProductWhere];
  if (query.category) and.push({ category: { slug: query.category, isActive: true } });
  if (query.brand.length) and.push({ brand: { in: query.brand } });
  if (query.min !== undefined) and.push({ price: { gte: koboToDecimalString(query.min) } });
  if (query.max !== undefined) and.push({ price: { lte: koboToDecimalString(query.max) } });
  if (query.inStock) and.push({ variants: { some: { isActive: true, stock: { gt: 0 } } } });
  if (query.q) and.push(...searchWhere(query.q));
  return { AND: and };
}

function orderByFor(sort: CatalogQuery["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "price-desc":
      return [{ price: "desc" }, { id: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export async function listProducts(query: CatalogQuery, pageSize = PAGE_SIZE): Promise<ProductListResult> {
  const where = buildProductWhere(query);
  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(query.page, pageCount);
  const rows = await db.product.findMany({
    where,
    include: cardInclude,
    orderBy: orderByFor(query.sort),
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return { items: rows.map(toCard), total, page, pageSize, pageCount };
}

/** Distinct brands available within an optional category (for filter facets). */
export async function listBrands(categorySlug?: string): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { AND: [visibleProductWhere, ...(categorySlug ? [{ category: { slug: categorySlug } }] : [])] },
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardDTO[]> {
  const rows = await db.product.findMany({
    where: { ...visibleProductWhere, isFeatured: true },
    include: cardInclude,
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
  });
  return rows.map(toCard);
}

export async function getNewArrivals(limit = 8): Promise<ProductCardDTO[]> {
  const rows = await db.product.findMany({
    where: visibleProductWhere,
    include: cardInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: limit,
  });
  return rows.map(toCard);
}

export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  const p = await db.product.findFirst({ where: { ...visibleProductWhere, slug }, include: cardInclude });
  if (!p) return null;
  const base = decimalToKobo(p.price);
  const variants: VariantDTO[] = p.variants.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    priceKobo: v.priceOverride ? decimalToKobo(v.priceOverride) : base,
    stock: v.stock,
    attributes: parseAttributes(v.attributes),
  }));
  return {
    ...toCard(p),
    description: p.description,
    sku: p.sku,
    images: p.images.length ? p.images : p.category.image ? [p.category.image] : [],
    specifications: parseSpecs(p.specifications),
    variants,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getRelatedProducts(productId: string, categorySlug: string, limit = 4): Promise<ProductCardDTO[]> {
  const rows = await db.product.findMany({
    where: { ...visibleProductWhere, category: { slug: categorySlug, isActive: true }, id: { not: productId } },
    include: cardInclude,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(toCard);
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const rows = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { isActive: true, archivedAt: null } } } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    productCount: c._count.products,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDTO | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const c = await db.category.findFirst({ where: { slug, isActive: true } });
  return c ? { id: c.id, name: c.name, slug: c.slug, description: c.description, image: c.image } : null;
}

/** For the sitemap. */
export async function listSitemapEntries() {
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: visibleProductWhere, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return { products, categories };
}
