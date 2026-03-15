"use client";

import { Button } from "@/components/ui/button";

export default function ExploreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 text-center">
      <p className="text-muted-foreground/40 font-mono text-5xl font-bold mb-6">!</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Failed to load servers</h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
        Something went wrong while connecting to the MCP Registry. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
