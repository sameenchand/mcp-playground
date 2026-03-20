import { ConnectClient } from "@/components/inspector/connect-client";

export const metadata = {
  title: "Connect to an MCP Server",
  description:
    "Connect to any remote MCP server and inspect its tools, resources, and prompts live in your browser. Supports Streamable HTTP, SSE, and WebSocket.",
};

interface ConnectPageProps {
  searchParams: Promise<{ url?: string; headerNames?: string }>;
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const { url, headerNames } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Connect a Server</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Paste any remote MCP server URL to inspect its tools, resources, and prompts live — no
          installation needed. Supports Streamable HTTP, SSE, and WebSocket transports.
        </p>
      </div>

      <ConnectClient initialUrl={url} initialHeaderNames={headerNames} />
    </div>
  );
}
