import "server-only";
import { db } from "../db";
import { Errors } from "../http";
import { audit } from "../audit";
import type { CategoryInput } from "@/schemas/admin";

export async function listCategoriesAdmin() {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { archivedAt: null } } } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount: c._count.products,
  }));
}

export async function getCategoryAdmin(id: string) {
  return db.category.findUnique({ where: { id } });
}

async function assertSlugFree(slug: string, categoryId?: string) {
  const owner = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (owner && owner.id !== categoryId) throw Errors.conflict("That slug is already used by another category.", { field: "slug" });
}

export async function createCategory(input: CategoryInput, actorId: string) {
  await assertSlugFree(input.slug);
  return db.$transaction(async (tx) => {
    const category = await tx.category.create({ data: input });
    await audit({ actorId, action: "category.create", entityType: "Category", entityId: category.id, details: { name: category.name } }, tx);
    return category;
  });
}

/**
 * Deactivating a category hides it and its products from the storefront;
 * the products themselves are untouched and reappear if it is reactivated.
 */
export async function updateCategory(id: string, input: CategoryInput, actorId: string) {
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("Category not found");
  await assertSlugFree(input.slug, id);
  return db.$transaction(async (tx) => {
    const category = await tx.category.update({ where: { id }, data: input });
    await audit({ actorId, action: "category.update", entityType: "Category", entityId: id, details: { name: input.name, isActive: input.isActive } }, tx);
    return category;
  });
}

export async function deleteCategory(id: string, actorId: string) {
  const existing = await db.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!existing) throw Errors.notFound("Category not found");
  if (existing._count.products > 0) {
    throw Errors.conflict("This category still has products. Move them to another category or deactivate the category instead.");
  }
  await db.$transaction(async (tx) => {
    await tx.category.delete({ where: { id } });
    await audit({ actorId, action: "category.delete", entityType: "Category", entityId: id, details: { name: existing.name } }, tx);
  });
}
