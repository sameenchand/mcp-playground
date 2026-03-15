"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SandboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <div className="text-center max-w-md">
        <p className="font-medium text-foreground">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message || "An unexpected error occurred in the sandbox."}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/playground"
          className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Back to Playground
        </Link>
      </div>
    </div>
  );
}
