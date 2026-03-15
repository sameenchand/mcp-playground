import Link from "next/link";
import { fetchServers } from "@/lib/registry-api";
import { ServerGrid } from "@/components/registry/server-grid";
import type { Metadata } from "next";

export const revalidate = 3600;

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
        <h1 className="text-2xl font-bold text-foreground">Explore MCP Servers</h1>
        <p className="text-muted-foreground mt-1">
          {servers.length > 0 ? (
            <>
              {servers.length.toLocaleString()} servers loaded from the official MCP registry —{" "}
              <span className="text-green-500 font-medium">{liveCount} with live remote endpoints</span>
              {" "}you can test right now.{" "}
              <Link href="/docs/local-servers" className="text-primary hover:underline underline-offset-4">
                Want to test a local server?
              </Link>
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
