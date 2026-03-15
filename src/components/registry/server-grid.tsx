"use client";

import { useState } from "react";
import { ServerCard } from "./server-card";
import { SearchBar } from "./search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import type { MCPServer } from "@/lib/registry-api";

interface ServerGridProps {
  servers: MCPServer[];
}

export function ServerGrid({ servers }: ServerGridProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? servers.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          (s.description ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : servers;

  return (
    <div className="space-y-6">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search MCP servers..."
        className="max-w-lg"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-lg font-medium">No servers found matching your search</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Try a different term or browse all servers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ServerGridSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border/50 p-6 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-5 w-16 mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
