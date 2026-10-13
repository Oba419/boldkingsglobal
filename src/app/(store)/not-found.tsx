import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex animate-fade-up flex-col items-center gap-5 py-24 text-center">
      <p className="font-display text-8xl font-bold text-gold-gradient sm:text-9xl">404</p>
      <h1 className="section-title">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-muted">The product may have been removed, or the link may be mistyped. Try searching our shop instead.</p>
      <form action="/shop" method="get" role="search" className="mt-2 flex w-full max-w-md gap-2">
        <label htmlFor="nf-search" className="sr-only">
          Search products
        </label>
        <input id="nf-search" name="q" type="search" placeholder="Search products…" className="input rounded-full" />
        <button type="submit" className="btn-gold rounded-full">
          Search
        </button>
      </form>
      <Link href="/" className="text-sm font-medium underline">
        Back to the homepage
      </Link>
    </div>
  );
}
