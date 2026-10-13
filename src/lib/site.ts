/**
 * Static brand defaults. Editable business details (phones, announcement,
 * delivery fee…) live in the StoreSettings table and are managed from
 * /admin/settings; these values seed it and act as a fallback.
 */
export const SITE = {
  name: "Bold Kings Global",
  shortName: "Bold Kings",
  tagline: "Phones, laptops, gadgets & accessories",
  description:
    "Shop smartphones, laptops, tablets, audio, wearables and accessories from Bold Kings Global. Prices in naira, delivery across Nigeria, and real people ready to help on the phone or WhatsApp.",
  phonePrimary: "07063383383",
  phoneSecondary: "09024192157",
  locale: "en_NG",
} as const;
