"use client";

import { AlertCircle } from "lucide-react";

export default function ConnectError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-lg font-medium text-foreground">Something went wrong</p>
          <p className="text-muted-foreground mt-1 text-sm">
            An unexpected error occurred loading the connect page.
          </p>
        </div>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
