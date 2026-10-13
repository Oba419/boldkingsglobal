import "server-only";
import { db, type TxClient } from "../db";
import { Errors } from "../http";
import { audit } from "../audit";
import { decimalToKobo, koboToDecimalString } from "@/lib/money";
import type { ProductInput } from "@/schemas/admin";
import type { Prisma } from "@/generated/prisma/client";
import { LOW_STOCK_THRESHOLD } from "@/lib/order-rules";

export const ADMIN_PRODUCTS_PAGE_SIZE = 25;

export async function listProductsAdmin(params: { q?: string; status?: string; page?: number }) {
  const where: Prisma.ProductWhereInput = {};
  if (params.status === "archived") where.archivedAt = { not: null };
  else {
    where.archivedAt = null;
    if (params.status === "active") where.isActive = true;
    if (params.status === "inactive") where.isActive = false;
    if (params.status === "low-stock") where.variants = { some: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } } };
  }
  const q = params.q?.trim().slice(0, 100);
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
    ];
  }
  const page = Math.max(1, params.page ?? 1);
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE,
      take: ADMIN_PRODUCTS_PAGE_SIZE,
      include: { category: { select: { name: true } }, variants: { select: { stock: true, isActive: true } } },
    }),
  ]);
  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PAGE_SIZE)),
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      image: p.images[0] ?? null,
      category: p.category.name,
      priceKobo: decimalToKobo(p.price),
      stock: p.variants.filter((v) => v.isActive).reduce((a, v) => a + v.stock, 0),
      variantCount: p.variants.length,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      archived: p.archivedAt !== null,
    })),
  };
}

export async function getProductAdmin(id: string) {
  const p = await db.product.findUnique({
    where: { id },
    include: { variants: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }, _count: { select: { orderItems: true } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand,
    sku: p.sku,
    categoryId: p.categoryId,
    priceKobo: decimalToKobo(p.price),
    compareAtKobo: p.compareAtPrice ? decimalToKobo(p.compareAtPrice) : null,
    images: p.images,
    specifications: Array.isArray(p.specifications) ? (p.specifications as Array<{ label: string; value: string }>) : [],
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    archived: p.archivedAt !== null,
    orderCount: p._count.orderItems,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      priceOverrideKobo: v.priceOverride ? decimalToKobo(v.priceOverride) : null,
      stock: v.stock,
      isActive: v.isActive,
    })),
  };
}

async function assertUnique(tx: TxClient, input: ProductInput, productId?: string) {
  const slugOwner = await tx.product.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== productId) throw Errors.conflict("That slug is already used by another product.", { field: "slug" });
  if (input.sku) {
    const skuOwner = await tx.product.findUnique({ where: { sku: input.sku }, select: { id: true } });
    if (skuOwner && skuOwner.id !== productId) throw Errors.conflict("That product SKU is already in use.", { field: "sku" });
  }
  const variantOwners = await tx.productVariant.findMany({
    where: { sku: { in: input.variants.map((v) => v.sku) } },
    select: { sku: true, productId: true },
  });
  const clash = variantOwners.find((v) => v.productId !== productId);
  if (clash) throw Errors.conflict(`Variant SKU ${clash.sku} is already used by another product.`, { field: "variants" });
  const category = await tx.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
  if (!category) throw Errors.validation("Choose a valid category", { categoryId: ["Category not found"] });
}

function productData(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    brand: input.brand,
    sku: input.sku,
    categoryId: input.categoryId,
    price: koboToDecimalString(input.price),
    compareAtPrice: input.compareAtPrice === null ? null : koboToDecimalString(input.compareAtPrice),
    images: input.images,
    specifications: input.specifications,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
  };
}

export async function createProduct(input: ProductInput, actorId: string) {
  return db.$transaction(async (tx) => {
    await assertUnique(tx, input);
    const product = await tx.product.create({
      data: {
        ...productData(input),
        variants: {
          create: input.variants.map((v, i) => ({
            name: v.name,
            sku: v.sku,
            priceOverride: v.priceOverride === null ? null : koboToDecimalString(v.priceOverride),
            stock: v.stock,
            isActive: v.isActive,
            sortOrder: i,
          })),
        },
      },
      include: { variants: true },
    });
    const initial = product.variants.filter((v) => v.stock > 0);
    if (initial.length) {
      await tx.inventoryMovement.createMany({
        data: initial.map((v) => ({ variantId: v.id, change: v.stock, stockAfter: v.stock, reason: "INITIAL" as const, actorId })),
      });
    }
    await audit({ actorId, action: "product.create", entityType: "Product", entityId: product.id, details: { name: product.name } }, tx);
    return product;
  });
}

/**
 * Updates a product and reconciles its variants in one transaction:
 * existing variants are updated (stock changes are logged as adjustments),
 * new ones created, and removed ones deleted — or deactivated if they appear
 * in historical orders.
 */
export async function updateProduct(id: string, input: ProductInput, actorId: string) {
  return db.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id }, include: { variants: { include: { _count: { select: { orderItems: true } } } } } });
    if (!existing) throw Errors.notFound("Product not found");
    await assertUnique(tx, input, id);

    await tx.product.update({ where: { id }, data: productData(input) });

    const existingById = new Map(existing.variants.map((v) => [v.id, v]));
    const keptIds = new Set<string>();

    for (const [i, v] of input.variants.entries()) {
      const priceOverride = v.priceOverride === null ? null : koboToDecimalString(v.priceOverride);
      const current = v.id ? existingById.get(v.id) : undefined;
      if (current) {
        keptIds.add(current.id);
        const locked = await tx.$queryRaw<{ stock: number }[]>`SELECT "stock" FROM "ProductVariant" WHERE "id" = ${current.id} FOR UPDATE`;
        const stockNow = Number(locked[0]?.stock ?? current.stock);
        await tx.productVariant.update({
          where: { id: current.id },
          data: { name: v.name, sku: v.sku, priceOverride, stock: v.stock, isActive: v.isActive, sortOrder: i },
        });
        if (stockNow !== v.stock) {
          await tx.inventoryMovement.create({
            data: { variantId: current.id, change: v.stock - stockNow, stockAfter: v.stock, reason: "ADJUSTMENT", actorId, note: "Product edit" },
          });
        }
      } else {
        const created = await tx.productVariant.create({
          data: { productId: id, name: v.name, sku: v.sku, priceOverride, stock: v.stock, isActive: v.isActive, sortOrder: i },
        });
        if (created.stock > 0) {
          await tx.inventoryMovement.create({ data: { variantId: created.id, change: created.stock, stockAfter: created.stock, reason: "INITIAL", actorId } });
        }
      }
    }

    for (const v of existing.variants) {
      if (keptIds.has(v.id)) continue;
      if (v._count.orderItems > 0) await tx.productVariant.update({ where: { id: v.id }, data: { isActive: false } });
      else await tx.productVariant.delete({ where: { id: v.id } });
    }

    await audit({ actorId, action: "product.update", entityType: "Product", entityId: id, details: { name: input.name } }, tx);
    return tx.product.findUniqueOrThrow({ where: { id } });
  });
}

/** Archiving hides a product everywhere while keeping order history intact. */
export async function setProductArchived(id: string, archived: boolean, actorId: string) {
  const product = await db.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw Errors.notFound("Product not found");
  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: archived ? { archivedAt: new Date(), isActive: false, isFeatured: false } : { archivedAt: null } });
    await audit({ actorId, action: archived ? "product.archive" : "product.unarchive", entityType: "Product", entityId: id }, tx);
  });
}

/** Permanent deletion is only allowed for products never ordered. */
export async function deleteProduct(id: string, actorId: string) {
  const product = await db.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!product) throw Errors.notFound("Product not found");
  if (product._count.orderItems > 0) {
    throw Errors.conflict("This product appears in past orders and cannot be deleted. Archive it instead to hide it from the store.");
  }
  await db.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { variant: { productId: id } } });
    await tx.product.delete({ where: { id } });
    await audit({ actorId, action: "product.delete", entityType: "Product", entityId: id, details: { name: product.name } }, tx);
  });
}
