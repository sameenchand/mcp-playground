import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";

export const metadata = {
  title: "Introduction — MCP Playground Docs",
  description:
    "Get started with MCP Playground. Learn what it is, how it works, and how to test your first MCP server.",
};

export default function GettingStartedPage() {
  return (
    <article className="max-w-none">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Getting Started
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Introduction
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          MCP Playground is an open-source web app for discovering, inspecting,
          and interactively testing MCP servers — directly in your browser,
          with no local setup required.
        </p>
      </div>

      {/* What is MCP */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          What is MCP?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          The{" "}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-4"
          >
            Model Context Protocol
          </a>{" "}
          (MCP) is an open standard that lets AI models connect to external
          tools, data sources, and services. Servers expose{" "}
          <strong className="text-foreground font-medium">tools</strong> (functions AI can call),{" "}
          <strong className="text-foreground font-medium">resources</strong>{" "}
          (structured data), and{" "}
          <strong className="text-foreground font-medium">prompts</strong>{" "}
          (reusable instruction templates).
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Examples of MCP servers: search engines, code interpreters, GitHub
          integrations, database connectors, web scrapers, and more.
        </p>
      </section>

      {/* What MCP Playground does */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          What MCP Playground does
        </h2>
        <div className="space-y-4">
          {[
            {
              step: "01",
              title: "Browse the MCP Registry",
              body: "Explore hundreds of publicly listed MCP servers on the /explore page. Filter by name, read descriptions, and see available packages.",
            },
            {
              step: "02",
              title: "Connect to any remote server",
              body: "Paste a Streamable HTTP or SSE endpoint URL on the /connect page. MCP Playground connects server-side and returns all available tools, resources, and prompts.",
            },
            {
              step: "03",
              title: "Run tools interactively",
              body: "The Playground auto-generates a typed form from each tool's JSON Schema. Fill in the arguments and execute — results appear inline, and execution history is saved in your browser.",
            },
            {
              step: "04",
              title: "Share what you find",
              body: "Every execution is shareable. Copy a link that auto-connects, selects the tool, pre-fills arguments, and optionally auto-runs — so others can reproduce your exact session.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <span className="text-lg font-bold text-primary/30 tabular-nums w-7 shrink-0 leading-tight mt-0.5">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture note */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          How it works (architecture)
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          All MCP connections are made{" "}
          <strong className="text-foreground font-medium">
            server-side, never in the browser
          </strong>
          . Your browser talks to a Next.js API route, which connects to the
          remote MCP server using the official MCP SDK, and returns the result
          as JSON.
        </p>
        <div className="rounded-lg bg-muted/20 border border-border/50 px-4 py-3.5 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre leading-loose">
          {`Browser → Next.js API Route → MCP SDK Client → Remote MCP Server
                                       ↓
Browser ← JSON Response ←  API Route ← MCP Server Response`}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          This means the MCP server URL never needs to be CORS-enabled, and
          your auth headers never leave the server-side request. Auth headers
          you provide are only stored in{" "}
          <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
            sessionStorage
          </code>{" "}
          in your browser and sent in the POST body — they are never persisted
          on our servers.
        </p>
      </section>

      {/* What's supported */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Supported transports
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              name: "Streamable HTTP",
              status: "supported",
              note: "Tried first on every connection. Recommended for new servers.",
            },
            {
              name: "SSE (Server-Sent Events)",
              status: "supported",
              note: "Automatic fallback if Streamable HTTP fails.",
            },
            {
              name: "stdio (local process)",
              status: "not-direct",
              note: "Not directly supported, but you can bridge it with supergateway.",
            },
            {
              name: "WebSocket",
              status: "supported",
              note: "Use ws:// or wss:// URLs.",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="flex gap-3 rounded-lg border border-border/40 p-3.5"
            >
              <span
                className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                  item.status === "supported"
                    ? "bg-green-500"
                    : item.status === "not-direct"
                      ? "bg-yellow-500"
                      : "bg-muted-foreground/30"
                }`}
              />
              <div>
                <p className="text-xs font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Next steps */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Next steps
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/connecting-servers"
            className={buttonVariants({ variant: "default" })}
          >
            Connecting Servers
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Link>
          <Link
            href="/explore"
            className={buttonVariants({ variant: "outline" })}
          >
            Browse the Registry
          </Link>
          <a
            href="https://modelcontextprotocol.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            MCP Official Docs
          </a>
        </div>
      </section>
    </article>
  );
}
