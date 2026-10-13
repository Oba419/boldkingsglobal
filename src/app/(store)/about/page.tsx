import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/server/services/settings";
import { telHref } from "@/lib/phone";
import { SITE } from "@/lib/site";
import { PageHero } from "@/components/store/page-hero";

export const metadata: Metadata = { title: "About us", description: SITE.description, alternates: { canonical: "/about" } };

// Draft copy: replace with the business's own story before launch (see README).
export default async function AboutPage() {
  const s = await getSettings();
  return (
    <>
    <PageHero eyebrow="About" title={`About ${s.businessName}`} crumbs={[{ label: "About" }]} />
    <div className="container-page py-12">
    <div className="card prose-page mx-auto max-w-3xl animate-fade-up p-6 sm:p-10">
      <p className="mt-4 text-lg">{SITE.description}</p>

      <h2>What we sell</h2>
      <p>
        Smartphones, laptops, tablets, audio, wearables and the accessories that go with them. Browse the full range in our <Link href="/shop">shop</Link>.
      </p>

      <h2>How we work</h2>
      <ul>
        <li>All prices are shown in naira, and every order is priced and stock-checked by our system when you place it.</li>
        <li>You can pay online, or choose any offline payment option we currently offer at checkout.</li>
        <li>We deliver across Nigeria and confirm delivery details with you before dispatch.</li>
      </ul>

      <h2>Talk to us</h2>
      <p>
        Prefer to speak to someone? Call <a href={telHref(s.phonePrimary)}>{s.phonePrimary}</a>
        {s.phoneSecondary ? (
          <>
            {" "}
            or <a href={telHref(s.phoneSecondary)}>{s.phoneSecondary}</a>
          </>
        ) : null}
        , or visit our <Link href="/contact">contact page</Link>.
      </p>
    </div>
    </div>
    </>
  );
}
