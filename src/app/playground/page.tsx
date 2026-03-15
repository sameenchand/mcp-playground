import { redirect } from "next/navigation";
import { PlaygroundClient } from "@/components/playground/playground-client";

interface PlaygroundPageProps {
  searchParams: Promise<{
    url?: string;
    tool?: string;
    args?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PlaygroundPageProps) {
  const { url } = await searchParams;
  return {
    title: url ? `Playground — ${url}` : "Playground — MCP Playground",
    description: "Interactively test MCP server tools with live execution.",
  };
}

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
  const { url, tool, args: argsParam } = await searchParams;

  if (!url) {
    redirect("/connect");
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
