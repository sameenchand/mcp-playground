import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { fetchServers } from "@/lib/registry-api";
import { ServerGrid } from "@/components/registry/server-grid";

export const metadata = {
  title: "Explore MCP Servers — MCP Playground",
  description: "Browse and search all MCP servers from the official registry.",
};

export default async function ExplorePage() {
  const servers = await fetchServers();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Explore MCP Servers</h1>
        <p className="text-muted-foreground mt-1">
          {servers.length > 0
            ? `${servers.length} servers in the official registry`
            : "Browse servers from the official MCP registry"}
        </p>
      </div>

      {/* Registry notice banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
        <Package className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-300 font-medium">
            These are installable packages, not live servers
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            The MCP registry lists stdio-based packages meant for local installation — they don&apos;t
            have remote HTTP endpoints you can connect to directly.
          </p>
        </div>
        <Link
          href="/connect"
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          Connect by URL <ArrowRight className="h-3 w-3" />
        </Link>
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
