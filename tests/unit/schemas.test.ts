import { describe, expect, it } from "vitest";
import { parseCatalogQuery } from "@/schemas/catalog";
import { createOrderSchema } from "@/schemas/checkout";
import { productInputSchema } from "@/schemas/admin";
import { registerSchema } from "@/schemas/auth";
import { safeNext } from "@/lib/utils";

describe("catalog query parsing", () => {
  it("applies defaults", () => {
    expect(parseCatalogQuery({})).toEqual({ q: "", category: undefined, brand: [], min: undefined, max: undefined, inStock: false, sort: "newest", page: 1 });
  });

  it("drops invalid values instead of failing", () => {
    const q = parseCatalogQuery({ category: "../etc", min: "abc", sort: "hack", page: "-3", brand: ["Apple", ""] });
    expect(q.category).toBeUndefined();
    expect(q.min).toBeUndefined();
    expect(q.sort).toBe("newest");
    expect(q.page).toBe(1);
    expect(q.brand).toEqual(["Apple"]);
  });

  it("converts price filters to kobo", () => {
    expect(parseCatalogQuery({ min: "50000", max: "1,000,000" })).toMatchObject({ min: 5_000_000, max: 100_000_000 });
  });
});

describe("order creation input", () => {
  const valid = {
    fullName: "Ada Obi",
    phone: "08012345678",
    email: "",
    state: "Lagos",
    city: "Ikeja",
    address: "12 Allen Avenue",
    paymentMethod: "PAY_ON_DELIVERY",
    idempotencyKey: "0f8fad5b-d9cb-469f-a165-70867728950e",
    items: [{ variantId: "v1", quantity: 2 }],
  };

  it("accepts a valid order", () => {
    expect(createOrderSchema.safeParse(valid).success).toBe(true);
  });

  it("strips client-supplied prices and totals", () => {
    const parsed = createOrderSchema.parse({ ...valid, total: 1, items: [{ variantId: "v1", quantity: 1, price: 1 }] });
    expect(parsed).not.toHaveProperty("total");
    expect(parsed.items[0]).toEqual({ variantId: "v1", quantity: 1 });
  });

  it.each([
    ["quantity of zero", { items: [{ variantId: "v1", quantity: 0 }] }],
    ["fractional quantity", { items: [{ variantId: "v1", quantity: 1.5 }] }],
    ["quantity over the per-line cap", { items: [{ variantId: "v1", quantity: 11 }] }],
    ["empty cart", { items: [] }],
    ["invalid phone", { phone: "12345" }],
    ["unknown state", { state: "Atlantis" }],
    ["short idempotency key", { idempotencyKey: "abc" }],
  ])("rejects %s", (_label, override) => {
    expect(createOrderSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe("product input", () => {
  const base = {
    name: "Test Phone",
    slug: "test-phone",
    description: "A phone used in tests.",
    brand: "Test",
    sku: "",
    categoryId: "cat1",
    price: "100000",
    compareAtPrice: "",
    images: [],
    specifications: [],
    isActive: true,
    isFeatured: false,
    variants: [{ name: "Standard", sku: "tp-1", priceOverride: "", stock: "5", isActive: true }],
  };

  it("converts naira strings to kobo and normalises SKUs", () => {
    const p = productInputSchema.parse(base);
    expect(p.price).toBe(10_000_000);
    expect(p.compareAtPrice).toBeNull();
    expect(p.sku).toBeNull();
    expect(p.variants[0]).toMatchObject({ sku: "TP-1", stock: 5, priceOverride: null });
  });

  it("rejects a comparison price that isn't higher", () => {
    expect(productInputSchema.safeParse({ ...base, compareAtPrice: "100000" }).success).toBe(false);
  });

  it("rejects duplicate variant SKUs and negative stock", () => {
    const v = base.variants[0]!;
    expect(productInputSchema.safeParse({ ...base, variants: [v, { ...v, name: "Other" }] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, variants: [{ ...v, stock: "-1" }] }).success).toBe(false);
  });

  it("only allows uploaded or bundled image paths", () => {
    expect(productInputSchema.safeParse({ ...base, images: ["https://evil.example/x.png"] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, images: ["/uploads/abc.png"] }).success).toBe(true);
  });
});

describe("auth", () => {
  it("requires a reasonably strong password", () => {
    expect(registerSchema.safeParse({ name: "Ada", email: "a@b.co", password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ada", email: "a@b.co", password: "onlyletterslong" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ada", email: "a@b.co", password: "longenough123" }).success).toBe(true);
  });

  it("only allows same-site redirect targets", () => {
    expect(safeNext("/checkout", "/account")).toBe("/checkout");
    expect(safeNext("//evil.example", "/account")).toBe("/account");
    expect(safeNext("/\\evil.example", "/account")).toBe("/account");
    expect(safeNext("https://evil.example", "/account")).toBe("/account");
    expect(safeNext(undefined, "/account")).toBe("/account");
  });
});
