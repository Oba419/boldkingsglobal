import Link from "next/link";

/** Fallback for URLs outside the storefront (the store has its own styled 404). */
export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-8xl font-bold text-gold-gradient">404</p>
      <h1 className="section-title">Page not found</h1>
      <Link href="/" className="btn-primary">
        Go to the homepage
      </Link>
    </div>
  );
}
