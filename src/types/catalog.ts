import type { Kobo } from "@/lib/money";

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount?: number;
};

export type ProductCardDTO = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  priceKobo: Kobo;
  compareAtKobo: Kobo | null;
  /** True when variants have different prices — listing shows "From …". */
  hasPriceRange: boolean;
  inStock: boolean;
  /** Set when the product has exactly one purchasable variant, enabling quick add-to-cart. */
  quickAddVariantId: string | null;
  quickAddMaxQty: number;
  category: { name: string; slug: string };
};

export type VariantDTO = {
  id: string;
  name: string;
  sku: string;
  priceKobo: Kobo;
  stock: number;
  attributes: Record<string, string> | null;
};

export type SpecificationDTO = { label: string; value: string };

export type ProductDetailDTO = ProductCardDTO & {
  description: string;
  sku: string | null;
  images: string[];
  specifications: SpecificationDTO[];
  variants: VariantDTO[];
  createdAt: string;
  updatedAt: string;
};

export type ProductListResult = {
  items: ProductCardDTO[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
