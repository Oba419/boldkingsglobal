import type { MetadataRoute } from "next";
import { appUrl } from "@/server/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/account", "/cart", "/checkout", "/order-confirmation/"] }],
    sitemap: appUrl("/sitemap.xml"),
  };
}
