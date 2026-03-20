import Link from "next/link";
import { ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/lib/button-variants";

export const metadata = {
  title: "About — MCP Playground",
  description:
    "MCP Playground is an open-source tool for discovering, inspecting, and testing MCP servers live in your browser.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-2">
        About MCP Playground
      </h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        The fastest way to discover, inspect, and test MCP servers — directly in
        your browser, with no local setup.
      </p>

      <Separator className="mb-8" />

      <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
        {/* Why we built this */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Why we built this
          </h2>
          <p className="mb-3">
            The MCP ecosystem is growing fast — hundreds of servers in the
            registry, more shipping every week. But there was no easy way to
            try them. Want to test a server? Install it locally, wire up
            stdio transport, write a client script, hope the schema is
            documented. Most developers gave up before seeing what a server
            actually does.
          </p>
          <p>
            MCP Playground fixes that. Paste a URL, click connect, and you are
            interacting with the server in seconds. For npm stdio servers, the
            in-browser sandbox runs them without any local setup at all. Think
            of it as Postman for the MCP ecosystem.
          </p>
        </section>

        {/* What you can do */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            What you can do
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Browse the Registry",
                desc: "Explore all publicly listed MCP servers. Filter, search, and see what tools each one exposes.",
              },
              {
                title: "Connect & Inspect",
                desc: "Connect to any remote MCP server (Streamable HTTP or SSE). View all tools, resources, and prompts with their schemas.",
              },
              {
                title: "Test Tools Interactively",
                desc: "Auto-generated forms from JSON Schema. Fill in arguments, execute, see results — with full execution history.",
              },
              {
                title: "In-Browser Sandbox",
                desc: "Run any npm MCP server directly in your browser via WebContainers. No Node.js install, no terminal.",
              },
              {
                title: "Traffic Inspector",
                desc: "See every JSON-RPC message between client and server. Debug protocol issues visually.",
              },
              {
                title: "Share & Embed",
                desc: "Shareable links with auto-run. Embeddable iframes for docs. README badges for instant demos.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border/40 p-4"
              >
                <p className="text-sm font-medium text-foreground mb-1">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            How it works
          </h2>
          <p className="mb-4">
            All MCP connections happen server-side via a Next.js API route —
            your browser never talks to MCP servers directly. Auth headers stay
            in your browser&apos;s session storage and are forwarded securely.
            No data is stored on our servers.
          </p>
          <div className="rounded-lg bg-muted/20 border border-border/50 px-4 py-3.5 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre leading-loose">
            {`Browser → Next.js API Route → MCP SDK Client → Remote MCP Server
                                       ↓
Browser ← JSON Response ←  API Route ← MCP Server Response`}
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            The sandbox is the one exception: it runs the server process
            entirely in your browser via WebContainers (WASM), so nothing
            leaves your tab.
          </p>
        </section>

        {/* What is MCP */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            What is MCP?
          </h2>
          <p className="mb-3">
            The{" "}
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-4"
            >
              Model Context Protocol
            </a>{" "}
            is an open standard (created by Anthropic) for connecting AI models
            to external tools, data sources, and services. MCP servers expose
            three primitives:
          </p>
          <ul className="space-y-2">
            {[
              {
                name: "Tools",
                desc: "Functions the AI can call — search, create, compute, etc.",
              },
              {
                name: "Resources",
                desc: "Structured data the AI can read — files, database rows, API responses.",
              },
              {
                name: "Prompts",
                desc: "Reusable instruction templates with typed arguments.",
              },
            ].map((item) => (
              <li key={item.name} className="flex gap-2">
                <span className="text-primary shrink-0 font-medium">
                  {item.name}:
                </span>
                <span>{item.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Tech stack */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Next.js 15",
              "TypeScript",
              "Tailwind CSS",
              "shadcn/ui",
              "MCP SDK",
              "WebContainers",
              "Vercel",
            ].map((tech) => (
              <Badge
                key={tech}
                variant="secondary"
                className="font-mono text-xs"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </section>

        {/* Open source */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Open source
          </h2>
          <p className="mb-4">
            MCP Playground is fully open source and MIT licensed. Contributions,
            feedback, and bug reports are welcome. If you are building an MCP
            server, we would love to help you get listed and tested.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/sameenchand/mcp-playground"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default" })}
            >
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
            <Link
              href="/docs"
              className={buttonVariants({ variant: "outline" })}
            >
              Read the Docs
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
      </div>
    </div>
  );
}
