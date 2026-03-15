"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Clock, Search, Trash2, Zap } from "lucide-react";
import { curatedServers } from "@/lib/featured-servers";

interface RecentServer {
  url: string;
  name: string;
  toolCount: number;
  lastUsed: number;
}

const RECENT_KEY = "mcp_recent_servers";
const MAX_RECENT = 10;

function getRecentServers(): RecentServer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentServer[];
  } catch {
    return [];
  }
}

/** Save a server to recent list — exported for use by playground-client */
export function saveRecentServer(url: string, name: string, toolCount: number) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentServers().filter((s) => s.url !== url);
    const updated = [{ url, name, toolCount, lastUsed: Date.now() }, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

export function PlaygroundLanding() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [recentServers, setRecentServers] = useState<RecentServer[]>([]);

  useEffect(() => {
    setRecentServers(getRecentServers());
  }, []);

  const handleGo = (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    router.push(`/playground?url=${encodeURIComponent(targetUrl.trim())}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGo(url);
  };

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecentServers([]);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-foreground">Playground</h1>
        <p className="text-muted-foreground mt-2">
          Enter an MCP server URL to start testing tools interactively.
        </p>
      </div>

      {/* URL input */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-mcp-server.com/mcp"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!url.trim()}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="h-4 w-4" />
          Go
        </button>
      </form>

      {/* Recent servers */}
      {recentServers.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Recent servers
            </h2>
            <button
              onClick={clearRecent}
              className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
          <div className="space-y-1.5">
            {recentServers.map((server) => (
              <button
                key={server.url}
                onClick={() => handleGo(server.url)}
                className="w-full flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 hover:border-primary/40 hover:bg-muted/20 transition-all text-left group"
              >
                <Play className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {server.name}
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-mono truncate">
                    {server.url}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground/50 shrink-0">
                  {server.toolCount} tool{server.toolCount !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured servers */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border/50" />
          <p className="text-sm text-muted-foreground">
            {recentServers.length > 0 ? "or try a featured server" : "try a featured server"}
          </p>
          <div className="h-px flex-1 bg-border/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {curatedServers.map((server) => (
            <button
              key={server.id}
              onClick={() => handleGo(server.url)}
              className="text-left rounded-lg border border-border/50 bg-card p-4 hover:border-primary/40 hover:bg-muted/20 transition-all group"
            >
              <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {server.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {server.description}
              </p>
              {server.tryPrompt && (
                <p className="text-xs text-primary/70 mt-2">{server.tryPrompt}</p>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
