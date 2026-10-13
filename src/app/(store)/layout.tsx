import { Sparkles } from "lucide-react";
import { CartProvider } from "@/components/store/cart-context";
import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { listCategories } from "@/server/services/catalog";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, categories] = await Promise.all([getCurrentUser(), getSettings(), listCategories()]);
  const viewer = user ? { name: user.name, email: user.email, role: user.role } : null;
  const nav = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <CartProvider viewer={viewer}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      {settings.announcementEnabled && settings.announcementText ? (
        <div className="bg-gold-gradient px-4 py-2 text-center text-[13px] font-semibold text-navy-950">
          <Sparkles className="mr-1.5 inline size-3.5 -translate-y-px" aria-hidden />
          {settings.announcementText}
        </div>
      ) : null}
      <SiteHeader settings={settings} categories={nav} />
      <main id="main" className="min-h-[60vh] animate-fade-in">
        {children}
      </main>
      <SiteFooter settings={settings} categories={nav} />
    </CartProvider>
  );
}
