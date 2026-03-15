"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, Lock, Loader2 } from "lucide-react";
import type { HealthResult } from "@/app/api/mcp/health/route";

interface ServerHealthProps {
  url: string;
}

export function ServerHealth({ url }: ServerHealthProps) {
  const [result, setResult] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/mcp/health?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResult(data as HealthResult);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ status: "down", latencyMs: 0 });
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </span>
    );
  }

  if (!result) return null;

  if (result.status === "up") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-500 font-medium">
        <Wifi className="h-3.5 w-3.5" />
        Online · {result.latencyMs}ms
      </span>
    );
  }

  if (result.status === "auth_required") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-yellow-500 font-medium">
        <Lock className="h-3.5 w-3.5" />
        Online · Requires auth
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium">
      <WifiOff className="h-3.5 w-3.5" />
      Unreachable
    </span>
  );
}
