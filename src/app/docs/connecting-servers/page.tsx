import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata = {
  title: "Connecting Servers — MCP Playground Docs",
  description:
    "Learn how to connect to any remote MCP server in MCP Playground, including auth headers and transport options.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-4 py-2.5 my-3">
      <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <code className="flex-1 text-sm font-mono text-foreground break-all">
        {children}
      </code>
      <CopyButton value={children} />
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded font-mono">
      {children}
    </code>
  );
}

export default function ConnectingServersPage() {
  return (
    <article className="max-w-none">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Getting Started
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Connecting Servers
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          MCP Playground connects to any MCP server that exposes a remote
          endpoint — Streamable HTTP, SSE, or WebSocket transport.
        </p>
      </div>

      {/* Step 1: The Connect page */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Step 1 — Go to the Connect page
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Navigate to{" "}
          <Link href="/connect" className="text-primary hover:underline underline-offset-4">
            /connect
          </Link>{" "}
          and paste your server&apos;s URL. MCP Playground supports three
          transport types:
        </p>
        <div className="space-y-3 mb-4">
          <div className="rounded-lg border border-border/40 p-4">
            <p className="text-xs font-medium text-foreground mb-1">
              Streamable HTTP (recommended)
            </p>
            <CodeBlock>https://your-server.com/mcp</CodeBlock>
            <p className="text-xs text-muted-foreground">
              The newer MCP transport. Tried first on every connection.
            </p>
          </div>
          <div className="rounded-lg border border-border/40 p-4">
            <p className="text-xs font-medium text-foreground mb-1">
              SSE (Server-Sent Events)
            </p>
            <CodeBlock>https://your-server.com/sse</CodeBlock>
            <p className="text-xs text-muted-foreground">
              Legacy SSE transport. Automatically tried as a fallback if
              Streamable HTTP fails.
            </p>
          </div>
          <div className="rounded-lg border border-border/40 p-4">
            <p className="text-xs font-medium text-foreground mb-1">
              WebSocket
            </p>
            <CodeBlock>wss://your-server.com/mcp</CodeBlock>
            <p className="text-xs text-muted-foreground">
              For servers that use WebSocket transport. Use <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">ws://</code> or{" "}
              <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">wss://</code> URLs — connected directly via the MCP SDK.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground bg-muted/10 border border-border/40 rounded-lg px-4 py-3">
          <strong className="text-foreground font-medium">Note:</strong> For
          HTTP URLs, MCP Playground tries Streamable HTTP first, then falls
          back to SSE automatically. For WebSocket URLs (<code className="text-xs bg-muted/50 px-1 py-0.5 rounded">ws://</code> / <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">wss://</code>), it connects directly.
        </p>
      </section>

      {/* Step 2: Auth headers */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Step 2 — Add auth headers (if required)
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Many servers require authentication. MCP Playground lets you add
          arbitrary HTTP request headers on the Connect page. Common patterns:
        </p>
        <div className="space-y-4">
          {[
            {
              label: "Bearer token (most common)",
              key: "Authorization",
              value: "Bearer your-api-key",
            },
            {
              label: "API key header",
              key: "x-api-key",
              value: "your-api-key",
            },
            {
              label: "Custom header",
              key: "x-custom-header",
              value: "custom-value",
            },
          ].map((item) => (
            <div key={item.key} className="rounded-lg border border-border/40 p-4">
              <p className="text-xs font-medium text-foreground mb-2">
                {item.label}
              </p>
              <div className="flex gap-2">
                <div className="flex-1 rounded bg-muted/30 border border-border/40 px-3 py-1.5 text-xs font-mono text-muted-foreground">
                  {item.key}
                </div>
                <div className="flex-1 rounded bg-muted/30 border border-border/40 px-3 py-1.5 text-xs font-mono text-muted-foreground">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-muted/10 border border-border/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground font-medium">
              Privacy note:
            </strong>{" "}
            Auth headers are stored in{" "}
            <InlineCode>sessionStorage</InlineCode> only — they exist for the
            duration of your browser session and are never persisted to our
            servers. They are sent in the POST body of our API route and
            forwarded to your MCP server.
          </p>
        </div>
      </section>

      {/* Step 3: Inspect */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Step 3 — Inspect the server
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          After connecting, MCP Playground fetches all{" "}
          <strong className="text-foreground font-medium">tools</strong>,{" "}
          <strong className="text-foreground font-medium">resources</strong>,
          and{" "}
          <strong className="text-foreground font-medium">prompts</strong>{" "}
          your server exposes. You&apos;ll see:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "A list of all tools with their names, descriptions, and input schemas",
            "A list of resources with URI, mime type, and description",
            "A list of prompts with their argument schemas",
            "Server metadata (name, version, protocol version)",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-primary shrink-0">→</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Step 4: Playground */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Step 4 — Test tools in the Playground
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Click{" "}
          <strong className="text-foreground font-medium">
            Open in Playground
          </strong>{" "}
          from the inspect page. The Playground lets you:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground mb-4">
          {[
            "Select any tool from the sidebar",
            "Fill in arguments using an auto-generated form based on the tool's JSON Schema",
            "Execute the tool and see the full response",
            "Browse execution history (persisted in localStorage)",
            "Share a reproducible link with pre-filled args",
            "Generate config snippets to add the server to Claude Desktop, Cursor, or Claude Code",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-primary shrink-0">→</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Troubleshooting */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Troubleshooting
        </h2>
        <div className="space-y-3">
          {[
            {
              problem: "Connection failed",
              fix: "Make sure the server URL is publicly accessible and not behind a firewall or VPN. Localhost URLs are blocked in production — use supergateway to expose a local server.",
            },
            {
              problem: "Timeout",
              fix: "The server took more than 10 seconds to respond to the initial connection. Check if the server is running and healthy.",
            },
            {
              problem: "401 Unauthorized",
              fix: "The server requires authentication. Add your API key as an Authorization header (Bearer token) or the specific header your server expects.",
            },
            {
              problem: "CORS error in browser console",
              fix: "This shouldn't happen since all connections are server-side. If you see CORS errors, please open a GitHub issue.",
            },
            {
              problem: "No tools listed",
              fix: "The server connected but returned an empty tools list. This is valid — the server may only expose resources or prompts, or it may require initialization parameters.",
            },
          ].map((item) => (
            <div
              key={item.problem}
              className="rounded-lg border border-border/40 p-4"
            >
              <p className="text-xs font-semibold text-foreground mb-1">
                {item.problem}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.fix}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured public servers */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Free public servers to try
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          These servers are publicly accessible and require no authentication:
        </p>
        <div className="space-y-2">
          {[
            {
              name: "DeepWiki",
              url: "https://mcp.deepwiki.com/mcp",
              desc: "Query any GitHub repo's documentation",
            },
            {
              name: "MCP Registry",
              url: "https://registry.run.mcp.com.ai/mcp",
              desc: "Browse the official MCP server registry",
            },
          ].map((server) => (
            <div
              key={server.url}
              className="rounded-lg border border-border/40 p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-medium text-foreground">
                  {server.name}
                </p>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                  No auth required
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{server.desc}</p>
              <code className="text-xs font-mono text-muted-foreground/70">
                {server.url}
              </code>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/connect" className={buttonVariants({ variant: "default" })}>
          Connect a Server
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Link>
        <Link
          href="/docs/local-servers"
          className={buttonVariants({ variant: "outline" })}
        >
          Local Servers Guide
        </Link>
      </div>
    </article>
  );
}
