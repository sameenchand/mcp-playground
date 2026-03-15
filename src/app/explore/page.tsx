import { fetchServers } from "@/lib/registry-api";
import { ServerGrid } from "@/components/registry/server-grid";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  let count = 0;
  try {
    const { fetchServers: fs } = await import("@/lib/registry-api");
    const servers = await fs();
    count = servers.length;
  } catch {
    // fall through
  }
  return {
    title: count > 0 ? `Browse ${count} MCP Servers` : "Browse MCP Servers",
    description: `Explore ${count > 0 ? count + " " : ""}MCP servers from the official registry. Click any server to inspect it live — no installation needed.`,
  };
}

export default async function ExplorePage() {
  const servers = await fetchServers();
  const liveCount = servers.filter((s) => s.remoteUrl).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Explore MCP Servers</h1>
        <p className="text-muted-foreground mt-1">
          {servers.length > 0 ? (
            <>
              {servers.length} servers in the official registry —{" "}
              <span className="text-green-500 font-medium">{liveCount} with live remote endpoints</span>
              {" "}you can inspect and test right now
            </>
          ) : (
            "Browse servers from the official MCP registry"
          )}
        </p>
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
