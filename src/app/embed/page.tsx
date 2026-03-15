import type { Metadata } from "next";
import { PlaygroundClient } from "@/components/playground/playground-client";

interface EmbedPageProps {
  searchParams: Promise<{
    url?: string;
    tool?: string;
    args?: string;
  }>;
}

export const metadata: Metadata = {
  robots: "noindex",
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const { url, tool, args: argsParam } = await searchParams;

  if (!url) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground text-sm">
        <div className="text-center space-y-2">
          <p className="font-medium">No server URL provided</p>
          <p className="text-xs">Use ?url=https://your-server.com/mcp</p>
          <a
            href="/connect"
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            Open MCP Playground →
          </a>
        </div>
      </div>
    );
  }

  let initialArgs: Record<string, unknown> | undefined;
  if (argsParam) {
    try {
      initialArgs = JSON.parse(atob(argsParam)) as Record<string, unknown>;
    } catch {
      // Ignore malformed args
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <PlaygroundClient
        serverUrl={url}
        initialTool={tool}
        initialArgs={initialArgs}
        embedded
      />
    </div>
  );
}
