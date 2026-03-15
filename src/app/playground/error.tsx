"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PlaygroundError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <AlertCircle className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="text-lg font-medium text-foreground">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-1">An error occurred in the playground.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/connect"
          className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Back to Connect
        </Link>
      </div>
    </div>
  );
}
