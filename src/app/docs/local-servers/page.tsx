import Link from "next/link";
import { ArrowLeft, Terminal, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata = {
  title: "Using Local MCP Servers — MCP Playground",
  description:
    "Learn how to run stdio-based MCP servers locally with an HTTP transport so you can test them in MCP Playground.",
};

function CodeBlock({ label, command }: { label: string; command: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-4 py-2.5">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <code className="flex-1 text-sm font-mono text-foreground break-all">
          {command}
        </code>
        <CopyButton value={command} />
      </div>
    </div>
  );
}

export default function LocalServersGuide() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">
        Using Local MCP Servers
      </h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Most MCP servers in the registry are stdio-based packages meant for local use.
        Here&apos;s how to expose them over HTTP so you can test them in MCP Playground.
      </p>

      {/* Why local servers don't work directly */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Why can&apos;t I connect directly?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          MCP Playground connects to remote servers over HTTP (Streamable HTTP or SSE transport).
          Stdio-based servers communicate through standard input/output and need a local process
          to bridge them to HTTP. This is by design — running arbitrary processes in the browser
          would be a security risk.
        </p>
      </section>

      {/* Option 1: supergateway */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Option 1: supergateway (recommended)
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          <a
            href="https://github.com/supercorp-ai/supergateway"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-4"
          >
            supergateway
          </a>{" "}
          wraps any stdio MCP server and exposes it as an SSE endpoint with one command.
        </p>
        <div className="space-y-3">
          <CodeBlock
            label="Install globally"
            command="npm install -g supergateway"
          />
          <CodeBlock
            label="Run any stdio server over SSE (example: filesystem server)"
            command="npx supergateway --stdio 'npx -y @modelcontextprotocol/server-filesystem /tmp' --port 3001"
          />
          <CodeBlock
            label="Then connect in MCP Playground"
            command="http://localhost:3001/sse"
          />
        </div>
      </section>

      {/* Option 2: mcp-proxy */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Option 2: mcp-proxy (Python)
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          <a
            href="https://github.com/nichochar/mcp-proxy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-4"
          >
            mcp-proxy
          </a>{" "}
          is a Python tool that bridges stdio servers to SSE.
        </p>
        <div className="space-y-3">
          <CodeBlock label="Install" command="pip install mcp-proxy" />
          <CodeBlock
            label="Run a server with SSE transport"
            command="mcp-proxy --sse-port 3001 -- npx -y @modelcontextprotocol/server-filesystem /tmp"
          />
        </div>
      </section>

      {/* Option 3: built-in HTTP */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Option 3: Servers with built-in HTTP
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Some servers already support HTTP transport natively. Check the server&apos;s
          README for flags like <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">--transport sse</code> or{" "}
          <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">--transport http</code>.
        </p>
        <CodeBlock
          label="Example: a server with built-in SSE support"
          command="npx -y some-mcp-server --transport sse --port 3001"
        />
      </section>

      {/* Tips */}
      <section className="mb-10 rounded-lg border border-border/50 bg-muted/10 p-5">
        <h2 className="text-lg font-semibold text-foreground mb-3">Tips</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary shrink-0">1.</span>
            Make sure the port isn&apos;t blocked by your firewall.
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">2.</span>
            MCP Playground&apos;s SSRF protection blocks localhost in production. Use it locally during development.
          </li>
          <li className="flex gap-2">
            <span className="text-primary shrink-0">3.</span>
            For testing, we include a built-in test server: run <code className="text-xs bg-muted/30 px-1 rounded">pnpm test-server</code> in this repo.
          </li>
        </ul>
      </section>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/connect"
          className={buttonVariants({ variant: "default" })}
        >
          Connect a Server
        </Link>
        <a
          href="https://modelcontextprotocol.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          MCP Docs
        </a>
      </div>
    </div>
  );
}
