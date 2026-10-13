import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { PageHero } from "@/components/store/page-hero";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHero title="Your cart" eyebrow="Checkout" crumbs={[{ label: "Cart" }]} />
      <div className="container-page py-10">
        <CartView />
      </div>
    </>
  );
}
