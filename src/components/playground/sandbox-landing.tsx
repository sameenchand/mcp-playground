"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Play, Terminal, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Featured npm servers known to work in WebContainers ───────────────────────

interface FeaturedNpmServer {
  id: string;
  name: string;
  packageName: string;
  description: string;
  version?: string;
  highlightTool?: string;
}

const featuredNpmServers: FeaturedNpmServer[] = [
  {
    id: "mcp-server-fetch",
    name: "Fetch",
    packageName: "@anthropic-ai/mcp-server-fetch",
    description: "Fetch and extract content from URLs. Lightweight and works great in-browser.",
    highlightTool: "fetch",
  },
  {
    id: "mcp-server-everything",
    name: "Everything",
    packageName: "@anthropic-ai/mcp-server-everything",
    description: "Test server with sample tools, resources, and prompts. Perfect for exploring the MCP protocol.",
  },
  {
    id: "mcp-server-memory",
    name: "Memory",
    packageName: "@anthropic-ai/mcp-server-memory",
    description: "A simple key-value memory store. Great for testing persistent state across tool calls.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SandboxLanding() {
  const router = useRouter();
  const [packageInput, setPackageInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = packageInput.trim();
    if (!trimmed) return;

    // Parse optional version: "@scope/name@1.0.0" or "name@1.0.0"
    let name = trimmed;
    let version: string | undefined;
    const atIndex = trimmed.lastIndexOf("@");
    if (atIndex > 0 && !trimmed.startsWith("@", atIndex)) {
      name = trimmed.slice(0, atIndex);
      version = trimmed.slice(atIndex + 1);
    } else if (atIndex > 0 && trimmed.startsWith("@")) {
      // Scoped package: @scope/name@version
      const afterScope = trimmed.indexOf("/");
      const lastAt = trimmed.lastIndexOf("@");
      if (lastAt > afterScope) {
        name = trimmed.slice(0, lastAt);
        version = trimmed.slice(lastAt + 1);
      }
    }

    const params = new URLSearchParams({ package: name });
    if (version) params.set("version", version);
    router.push(`/playground/sandbox?${params.toString()}`);
  };

  const handleFeaturedClick = (server: FeaturedNpmServer) => {
    const params = new URLSearchParams({ package: server.packageName });
    if (server.version) params.set("version", server.version);
    if (server.highlightTool) params.set("tool", server.highlightTool);
    router.push(`/playground/sandbox?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
          <Terminal className="h-3 w-3" />
          In-Browser Sandbox
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Run any npm MCP server in your browser
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          No installation needed. Enter an npm package name and we&apos;ll spin up a full Node.js
          runtime in your browser using WebContainers. Everything runs locally — nothing is sent to
          our servers.
        </p>
      </div>

      {/* Package input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={packageInput}
            onChange={(e) => setPackageInput(e.target.value)}
            placeholder="@anthropic-ai/mcp-server-fetch"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
          />
        </div>
        <button
          type="submit"
          disabled={!packageInput.trim()}
          className="flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="h-4 w-4" />
          Run
        </button>
      </form>

      {/* Featured npm servers */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Try these servers
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredNpmServers.map((server) => (
            <button
              key={server.id}
              onClick={() => handleFeaturedClick(server)}
              className="group text-left p-4 rounded-lg border border-border/50 bg-card hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-sm text-foreground">{server.name}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{server.description}</p>
              <p className="text-xs font-mono text-muted-foreground/50 mt-2 truncate">
                {server.packageName}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-border/30 bg-muted/5 p-6 space-y-4">
        <h3 className="text-sm font-medium text-foreground">How it works</h3>
        <div className="grid gap-4 sm:grid-cols-3 text-sm text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium text-foreground">1. Boot</p>
            <p>A full Node.js runtime starts in your browser using WebContainers (WASM).</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">2. Install</p>
            <p>The npm package is installed inside the sandbox — you see real npm output.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">3. Connect</p>
            <p>We connect to the server via stdio and list its tools — ready to test.</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <Link href="/playground" className="hover:text-foreground transition-colors flex items-center gap-1">
          <Globe className="h-3.5 w-3.5" />
          Test remote servers
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/explore" className="hover:text-foreground transition-colors flex items-center gap-1">
          Browse MCP registry
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
