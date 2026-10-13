import { Errors, ok, route } from "@/server/http";
import { getProductBySlug } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export const GET = route<{ params: Promise<{ slug: string }> }>(async (_req, { params }) => {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) throw Errors.notFound("Product not found");
  return ok(product);
});
