import { PlaygroundClient } from "@/components/playground/playground-client";
import { PlaygroundLanding } from "@/components/playground/playground-landing";

interface PlaygroundPageProps {
  searchParams: Promise<{
    url?: string;
    tool?: string;
    args?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PlaygroundPageProps) {
  const { url } = await searchParams;
  if (!url) {
    return {
      title: "Playground",
      description: "Interactively test MCP server tools with live execution.",
    };
  }
  // Use hostname as a friendly server name
  let serverName = url;
  try {
    serverName = new URL(url).hostname;
  } catch {
    // fall through
  }
  return {
    title: `Testing ${serverName}`,
    description: `Interactive tool playground for ${url}. Run tools, inspect responses, and share sessions.`,
  };
}

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
  const { url, tool, args: argsParam } = await searchParams;

  if (!url) {
    return <PlaygroundLanding />;
  }

  // Decode initial args from base64 JSON if present
  let initialArgs: Record<string, unknown> | undefined;
  if (argsParam) {
    try {
      initialArgs = JSON.parse(atob(argsParam)) as Record<string, unknown>;
    } catch {
      // Ignore malformed args param
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <PlaygroundClient
        serverUrl={url}
        initialTool={tool}
        initialArgs={initialArgs}
      />
    </div>
  );
}
