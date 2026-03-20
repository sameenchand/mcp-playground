import { fetchServers } from "@/lib/registry-api";
import { QualityDashboard } from "@/components/quality/quality-dashboard";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "MCP Server Quality Dashboard",
  description:
    "Live quality grades for every MCP server in the registry. See which servers follow best practices, have complete schemas, and work reliably.",
};

export default async function QualityPage() {
  const allServers = await fetchServers();
  const liveServers = allServers
    .filter((s) => s.remoteUrl)
    .map((s) => ({
      id: s.id,
      name: s.name,
      url: s.remoteUrl!,
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Server Quality Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Live quality grades for{" "}
          <span className="text-foreground font-medium">
            {liveServers.length}
          </span>{" "}
          MCP servers with remote endpoints. Each server is inspected and graded
          A–F using{" "}
          <span className="text-foreground font-medium">15+ lint rules</span>{" "}
          covering tool descriptions, JSON Schema completeness, and metadata
          quality.
        </p>
      </div>

      <QualityDashboard servers={liveServers} />
    </div>
  );
}
