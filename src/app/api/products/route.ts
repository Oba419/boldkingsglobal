import { ok, route } from "@/server/http";
import { listProducts } from "@/server/services/catalog";
import { parseCatalogQuery } from "@/schemas/catalog";

export const dynamic = "force-dynamic";

/** GET /api/products?q=&category=&brand=&min=&max=&inStock=1&sort=&page= */
export const GET = route(async (req) => {
  const url = new URL(req.url);
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const all = url.searchParams.getAll(key);
    params[key] = all.length > 1 ? all : all[0]!;
  }
  return ok(await listProducts(parseCatalogQuery(params)));
});
