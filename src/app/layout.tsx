import type { Metadata, Viewport } from "next";
import { Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { SITE } from "@/lib/site";
import { resolveSiteUrl } from "@/lib/site-url";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
// Engraved serif for the wordmark and display moments, echoing the crest.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-cinzel", display: "swap" });

// Every page reads live catalog, stock and settings from the database.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, locale: SITE.locale, images: ["/images/brand/crest.jpg"] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#070d1a" },
    { media: "(prefers-color-scheme: dark)", color: "#05080f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme class is set before paint by the inline script, so React must not warn about it.
    <html lang="en-NG" className={`${jakarta.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors closeButton theme="system" toastOptions={{ className: "!rounded-xl" }} />
      </body>
    </html>
  );
}
