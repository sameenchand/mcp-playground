import Link from "next/link";
import { Terminal } from "lucide-react";
import { fetchServers } from "@/lib/registry-api";
import { ServerGrid } from "@/components/registry/server-grid";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Browse MCP Servers",
    description:
      "Explore servers from the official MCP registry. Filter by live remote endpoints, inspect tools and resources, and test them — no installation needed.",
  };
}

export default async function ExplorePage() {
  const servers = await fetchServers();
  const liveCount = servers.filter((s) => s.remoteUrl).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Explore MCP Servers</h1>
            {servers.length > 0 && (
              <p className="text-muted-foreground mt-1">
                {servers.length.toLocaleString()} servers from the official registry
                {" · "}
                <span className="text-green-500 font-medium">{liveCount} with live endpoints</span>
                {" "}you can test right now.
              </p>
            )}
          </div>
          <Link
            href="/docs/local-servers"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 w-full sm:w-fit justify-center sm:justify-start"
          >
            <Terminal className="h-3.5 w-3.5" />
            Local server? See how →
          </Link>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-lg font-medium">
            Could not load servers from the registry
          </p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            The registry may be temporarily unavailable. Please try again later.
          </p>
        </div>
      ) : (
        <ServerGrid servers={servers} />
      )}
    </div>
  );
}
