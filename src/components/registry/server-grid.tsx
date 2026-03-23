"use client";

import { useState, useMemo } from "react";
import { Wifi, Package, Lock, Tag } from "lucide-react";
import { ServerCard } from "./server-card";
import { SearchBar } from "./search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import type { MCPServer } from "@/lib/registry-api";

type FilterMode = "all" | "live" | "no-auth";

interface ServerGridProps {
  servers: MCPServer[];
}

export function ServerGrid({ servers }: ServerGridProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Top categories with at least 2 servers, sorted by count descending
  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of servers) {
      for (const cat of s.categories ?? []) {
        counts.set(cat, (counts.get(cat) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([cat, count]) => ({ cat, count }));
  }, [servers]);

  const liveCount = servers.filter((s) => s.remoteUrl).length;
  const noAuthCount = servers.filter(
    (s) => s.remoteUrl && !(s.remoteHeaders ?? []).some((h) => h.isRequired),
  ).length;

  const filtered = servers.filter((s) => {
    const matchesQuery =
      !query.trim() ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(query.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "live" && s.remoteUrl) ||
      (filter === "no-auth" &&
        s.remoteUrl &&
        !(s.remoteHeaders ?? []).some((h) => h.isRequired));

    const matchesCategory =
      !categoryFilter || (s.categories ?? []).includes(categoryFilter);

    return matchesQuery && matchesFilter && matchesCategory;
  });

  const filterButtons: Array<{ id: FilterMode; label: string; count: number; icon: React.ReactNode }> = [
    { id: "all", label: "All", count: servers.length, icon: null },
    {
      id: "live",
      label: "Testable now",
      count: liveCount,
      icon: <Wifi className="h-3 w-3" />,
    },
    {
      id: "no-auth",
      label: "No auth needed",
      count: noAuthCount,
      icon: <Package className="h-3 w-3" />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search MCP servers..."
          className="flex-1 max-w-lg"
        />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filter === btn.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {btn.icon}
              {btn.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  filter === btn.id ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                }`}
              >
                {btn.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      {topCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 py-1">
            <Tag className="h-3 w-3" />
          </span>
          {topCategories.map(({ cat, count }) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                categoryFilter === cat
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <span className="capitalize">{cat}</span>
              <span className="text-[10px] opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter description */}
      {filter === "live" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wifi className="h-3.5 w-3.5 text-green-500" />
          Servers with remote HTTP endpoints you can connect to and test right now.
        </div>
      )}
      {filter === "no-auth" && (
        <div className="flex items-center gap-2 text-xs text-amber-500/80">
          <Lock className="h-3.5 w-3.5" />
          Servers with live endpoints and no auth headers listed in the registry. Most work without a key, but some may still require one.
        </div>
      )}

      {/* Results count */}
      {(query || filter !== "all" || categoryFilter) && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} server{filtered.length !== 1 ? "s" : ""}
          {categoryFilter && <span> in <span className="capitalize font-medium text-foreground">{categoryFilter}</span></span>}
          {query && <span> matching &ldquo;{query}&rdquo;</span>}
        </p>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-lg font-medium">No servers found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            Try a different search or filter
          </p>
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
