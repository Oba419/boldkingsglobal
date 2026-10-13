"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] animate-fade-up flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="section-title">Something went wrong</h1>
      <p className="max-w-md text-muted">Sorry — we hit a problem loading this page. Please try again in a moment.</p>
      {error.digest ? <p className="font-mono text-xs text-muted">Reference: {error.digest}</p> : null}
      <div className="flex gap-3">
        <button type="button" className="btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Homepage
        </Link>
      </div>
    </div>
  );
}
