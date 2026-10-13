/**
 * Development seed: store settings, categories and a SAMPLE catalogue.
 *
 *   npm run db:seed
 *
 * The sample products, prices and stock levels are placeholders for local
 * development and demos — they are not real inventory. The script is
 * idempotent (upserts by slug/SKU) and refuses to run with NODE_ENV=production.
 */
import { createScriptClient } from "../scripts/prisma-client";
import { koboToDecimalString, parseNairaToKobo } from "../src/lib/money";
import { SITE } from "../src/lib/site";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed sample data with NODE_ENV=production. Add real products from /admin instead.");
  process.exit(1);
}

const naira = (amount: string) => koboToDecimalString(parseNairaToKobo(amount));

const CATEGORIES = [
  { slug: "smartphones", name: "Smartphones", description: "Android and iPhone smartphones for every budget.", sortOrder: 1 },
  { slug: "laptops", name: "Laptops", description: "Laptops for work, study and creative projects.", sortOrder: 2 },
  { slug: "tablets", name: "Tablets", description: "Tablets and iPads for reading, streaming and drawing.", sortOrder: 3 },
  { slug: "audio", name: "Audio", description: "Earbuds, headphones and Bluetooth speakers.", sortOrder: 4 },
  { slug: "wearables", name: "Wearables", description: "Smartwatches and fitness trackers.", sortOrder: 5 },
  { slug: "accessories", name: "Accessories", description: "Chargers, power banks, cables and cases.", sortOrder: 6 },
];

type SeedVariant = { name: string; sku: string; price?: string; stock: number; attributes?: Record<string, string> };
type SeedProduct = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  compareAt?: string;
  featured?: boolean;
  description: string;
  specs: Array<[string, string]>;
  variants: SeedVariant[];
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: "samsung-galaxy-a55-5g",
    name: "Samsung Galaxy A55 5G",
    brand: "Samsung",
    category: "smartphones",
    price: "520000",
    featured: true,
    description: "A mid-range 5G phone with a bright 6.6\" Super AMOLED display, metal frame and all-day battery.\n\nSample product for development.",
    specs: [["Display", "6.6\" Super AMOLED, 120Hz"], ["Battery", "5000 mAh"], ["Network", "5G"], ["Main camera", "50 MP"]],
    variants: [
      { name: "128GB / Awesome Navy", sku: "SAM-A55-128-NVY", stock: 6, attributes: { Storage: "128GB", Colour: "Awesome Navy" } },
      { name: "256GB / Awesome Navy", sku: "SAM-A55-256-NVY", price: "585000", stock: 3, attributes: { Storage: "256GB", Colour: "Awesome Navy" } },
    ],
  },
  {
    slug: "apple-iphone-15",
    name: "Apple iPhone 15",
    brand: "Apple",
    category: "smartphones",
    price: "1150000",
    featured: true,
    description: "iPhone 15 with Dynamic Island, a 48 MP main camera and USB-C.\n\nSample product for development.",
    specs: [["Display", "6.1\" Super Retina XDR"], ["Chip", "A16 Bionic"], ["Connector", "USB-C"], ["Main camera", "48 MP"]],
    variants: [
      { name: "128GB / Black", sku: "APL-IP15-128-BLK", stock: 4, attributes: { Storage: "128GB", Colour: "Black" } },
      { name: "256GB / Black", sku: "APL-IP15-256-BLK", price: "1320000", stock: 2, attributes: { Storage: "256GB", Colour: "Black" } },
    ],
  },
  {
    slug: "tecno-spark-20-pro",
    name: "Tecno Spark 20 Pro",
    brand: "Tecno",
    category: "smartphones",
    price: "245000",
    compareAt: "265000",
    description: "Large 6.78\" display, 108 MP camera and fast charging at an accessible price.\n\nSample product for development.",
    specs: [["Display", "6.78\" FHD+ 120Hz"], ["Battery", "5000 mAh, 33W"], ["RAM", "8GB"], ["Storage", "256GB"]],
    variants: [{ name: "Standard", sku: "TEC-SPK20P-256", stock: 12 }],
  },
  {
    slug: "hp-pavilion-15-core-i5",
    name: "HP Pavilion 15 (Core i5, 16GB, 512GB SSD)",
    brand: "HP",
    category: "laptops",
    price: "890000",
    featured: true,
    description: "A dependable 15.6\" laptop for work and study with a fast SSD and backlit keyboard.\n\nSample product for development.",
    specs: [["Processor", "Intel Core i5 (13th gen)"], ["Memory", "16GB"], ["Storage", "512GB SSD"], ["Display", "15.6\" FHD IPS"]],
    variants: [{ name: "Standard", sku: "HP-PAV15-I5-512", stock: 5 }],
  },
  {
    slug: "apple-macbook-air-13-m3",
    name: "Apple MacBook Air 13\" (M3)",
    brand: "Apple",
    category: "laptops",
    price: "1850000",
    description: "Thin, silent and fast, with all-day battery life and a Liquid Retina display.\n\nSample product for development.",
    specs: [["Chip", "Apple M3"], ["Memory", "8GB unified"], ["Display", "13.6\" Liquid Retina"], ["Weight", "1.24 kg"]],
    variants: [
      { name: "256GB / Midnight", sku: "APL-MBA13-M3-256", stock: 2, attributes: { Storage: "256GB" } },
      { name: "512GB / Midnight", sku: "APL-MBA13-M3-512", price: "2250000", stock: 1, attributes: { Storage: "512GB" } },
    ],
  },
  {
    slug: "lenovo-ideapad-slim-3",
    name: "Lenovo IdeaPad Slim 3 (Ryzen 5, 8GB, 512GB SSD)",
    brand: "Lenovo",
    category: "laptops",
    price: "640000",
    description: "A lightweight everyday laptop with a full-HD screen and a fast SSD.\n\nSample product for development.",
    specs: [["Processor", "AMD Ryzen 5"], ["Memory", "8GB"], ["Storage", "512GB SSD"], ["Display", "15.6\" FHD"]],
    variants: [{ name: "Standard", sku: "LEN-IPS3-R5-512", stock: 0 }],
  },
  {
    slug: "apple-ipad-10th-gen",
    name: "Apple iPad (10th generation)",
    brand: "Apple",
    category: "tablets",
    price: "560000",
    description: "A colourful all-screen iPad for notes, streaming and video calls.\n\nSample product for development.",
    specs: [["Display", "10.9\" Liquid Retina"], ["Chip", "A14 Bionic"], ["Connector", "USB-C"]],
    variants: [{ name: "64GB Wi-Fi", sku: "APL-IPAD10-64", stock: 4 }],
  },
  {
    slug: "samsung-galaxy-tab-a9-plus",
    name: "Samsung Galaxy Tab A9+",
    brand: "Samsung",
    category: "tablets",
    price: "310000",
    description: "An 11\" family tablet with quad speakers and a 90Hz display.\n\nSample product for development.",
    specs: [["Display", "11\" 90Hz"], ["Speakers", "Quad, Dolby Atmos"], ["Storage", "64GB"]],
    variants: [{ name: "Standard", sku: "SAM-TABA9P-64", stock: 7 }],
  },
  {
    slug: "apple-airpods-pro-2",
    name: "Apple AirPods Pro (2nd generation)",
    brand: "Apple",
    category: "audio",
    price: "385000",
    featured: true,
    description: "Active noise cancellation, adaptive audio and a USB-C MagSafe case.\n\nSample product for development.",
    specs: [["Noise cancelling", "Active"], ["Case", "USB-C MagSafe"], ["Battery", "Up to 6 hours (ANC on)"]],
    variants: [{ name: "Standard", sku: "APL-APP2-USBC", stock: 8 }],
  },
  {
    slug: "oraimo-freepods-4",
    name: "Oraimo FreePods 4",
    brand: "Oraimo",
    category: "audio",
    price: "38500",
    description: "Affordable noise-cancelling earbuds with long battery life.\n\nSample product for development.",
    specs: [["Noise cancelling", "Active"], ["Battery", "Up to 35 hours with case"]],
    variants: [{ name: "Standard", sku: "ORA-FP4", stock: 25 }],
  },
  {
    slug: "apple-watch-se-44mm",
    name: "Apple Watch SE (44mm, GPS)",
    brand: "Apple",
    category: "wearables",
    price: "420000",
    description: "Activity tracking, crash detection and notifications on your wrist.\n\nSample product for development.",
    specs: [["Case size", "44mm"], ["Connectivity", "GPS"], ["Water resistance", "50 m"]],
    variants: [{ name: "Standard", sku: "APL-WSE-44-GPS", stock: 3 }],
  },
  {
    slug: "anker-powercore-20000",
    name: "Anker PowerCore 20,000mAh Power Bank",
    brand: "Anker",
    category: "accessories",
    price: "45000",
    featured: true,
    description: "High-capacity power bank that charges a phone several times over.\n\nSample product for development.",
    specs: [["Capacity", "20,000 mAh"], ["Output", "USB-C PD 20W"]],
    variants: [{ name: "Standard", sku: "ANK-PC20K", stock: 2 }],
  },
  {
    slug: "usb-c-fast-charger-25w",
    name: "Samsung 25W USB-C Fast Charger",
    brand: "Samsung",
    category: "accessories",
    price: "18000",
    description: "Genuine 25W Super Fast Charging wall adapter.\n\nSample product for development.",
    specs: [["Output", "25W USB-C PD"], ["Cable", "Not included"]],
    variants: [{ name: "Standard", sku: "SAM-TA25W", stock: 30 }],
  },
];

async function main() {
  const db = createScriptClient();
  try {
    await db.storeSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        businessName: SITE.name,
        phonePrimary: SITE.phonePrimary,
        phoneSecondary: SITE.phoneSecondary,
        whatsappNumber: SITE.phonePrimary,
        // Development default so checkout works out of the box. Review in /admin/settings.
        payOnDeliveryEnabled: true,
      },
    });

    const categoryIds = new Map<string, string>();
    for (const c of CATEGORIES) {
      const row = await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
      categoryIds.set(c.slug, row.id);
    }

    let created = 0;
    for (const p of PRODUCTS) {
      const exists = await db.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
      if (exists) continue;
      await db.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            description: p.description,
            categoryId: categoryIds.get(p.category)!,
            price: naira(p.price),
            compareAtPrice: p.compareAt ? naira(p.compareAt) : null,
            isFeatured: p.featured ?? false,
            images: [],
            specifications: p.specs.map(([label, value]) => ({ label, value })),
            variants: {
              create: p.variants.map((v, i) => ({
                name: v.name,
                sku: v.sku,
                priceOverride: v.price ? naira(v.price) : null,
                stock: v.stock,
                attributes: v.attributes,
                sortOrder: i,
              })),
            },
          },
          include: { variants: true },
        });
        const stocked = product.variants.filter((v) => v.stock > 0);
        if (stocked.length) {
          await tx.inventoryMovement.createMany({
            data: stocked.map((v) => ({ variantId: v.id, change: v.stock, stockAfter: v.stock, reason: "INITIAL" as const, note: "Seed" })),
          });
        }
      });
      created++;
    }
    console.log(`Seed complete: ${CATEGORIES.length} categories, ${created} new sample product(s) (${PRODUCTS.length - created} already present).`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
