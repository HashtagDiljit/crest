"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <h1 className="font-display text-20 font-semibold text-text-primary">Something went wrong</h1>
      <p className="text-13 text-text-muted max-w-sm">
        We hit an unexpected error loading this page. This can sometimes happen on first sign-in — try
        refreshing the page.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}
