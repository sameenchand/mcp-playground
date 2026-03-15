import Link from "next/link";
import { ArrowRight, Link2, Layers, Zap, Github, Star, Badge } from "lucide-react";
import { fetchServers } from "@/lib/registry-api";

async function getRegistryCount(): Promise<number> {
  try {
    const servers = await fetchServers();
    return servers.length;
  } catch {
    return 100;
  }
}

function PlaygroundMockup() {
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent blur-xl" />
      <div className="relative rounded-2xl border border-border/40 bg-card shadow-2xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/30 bg-muted/30">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
          <div className="flex-1 mx-4 h-6 rounded-md bg-background/50 border border-border/30 flex items-center px-3">
            <span className="text-[11px] text-muted-foreground/50 font-mono">
              mcpplayground.dev/playground?url=https://demo.example.com/mcp
            </span>
          </div>
        </div>

        {/* Connection header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/20 bg-muted/10">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span className="text-xs font-medium text-foreground">demo-mcp-server</span>
            <span className="text-xs text-muted-foreground/60 font-mono">v1.0.0</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium">
            Streamable HTTP
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/50">4 tools · 2 resources · 1 prompt</span>
        </div>

        {/* 3-panel layout */}
        <div className="grid grid-cols-[160px_1fr_200px] h-[300px] sm:h-[340px] divide-x divide-border/20">
          {/* Left: Tool sidebar */}
          <div className="p-3 space-y-1 overflow-hidden">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-2.5">
              TOOLS · 4
            </p>
            {[
              { name: "greet", active: false },
              { name: "add", active: false },
              { name: "get_weather", active: true },
              { name: "batch_process", active: false },
            ].map(({ name, active }) => (
              <div
                key={name}
                className={`px-2.5 py-2 rounded-md text-[11px] font-mono transition-colors ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground/70 hover:bg-muted/50"
                }`}
              >
                {name}
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-border/20">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-2">
                HISTORY
              </p>
              {[
                { name: "greet", ok: true },
                { name: "add", ok: true },
              ].map(({ name, ok }) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 px-1 py-1 text-[10px] text-muted-foreground/50"
                >
                  <span className={ok ? "text-green-500" : "text-red-400"}>✓</span>
                  <span className="font-mono">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Form */}
          <div className="p-4 overflow-hidden">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground font-mono">get_weather</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Fetches real-time weather for a location</p>
            </div>
            <div className="space-y-3">
              {/* city field */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-medium text-foreground">location.city</span>
                  <span className="text-red-400 text-[10px]">*</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    string
                  </span>
                </div>
                <div className="h-7 rounded-md border border-border/50 bg-background/50 px-2.5 flex items-center text-[11px] text-muted-foreground/80 font-mono">
                  San Francisco
                </div>
              </div>
              {/* units field */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-medium text-foreground">units</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    enum
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <label className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-3 w-3 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />
                    celsius
                  </label>
                  <label className="flex items-center gap-1.5 text-foreground">
                    <span className="h-3 w-3 rounded-full border-2 border-primary flex-shrink-0 bg-primary/80" />
                    fahrenheit
                  </label>
                </div>
              </div>
              {/* Run button */}
              <div className="pt-1">
                <div className="h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center gap-2 text-[12px] font-medium">
                  <Zap className="h-3.5 w-3.5" />
                  Run get_weather
                  <span className="text-[10px] opacity-60 ml-1">⌘↵</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Response */}
          <div className="p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                RESPONSE
              </p>
              <span className="text-[9px] text-green-400/70">245ms</span>
            </div>
            <div className="rounded-lg bg-background/60 border border-border/30 p-2.5 font-mono text-[10px] leading-relaxed">
              <span className="text-muted-foreground/60">{"{"}</span>
              <div className="pl-3 space-y-0.5">
                <div>
                  <span className="text-blue-300/80">&quot;location&quot;</span>
                  <span className="text-muted-foreground/60">: </span>
                  <span className="text-green-300/80">&quot;San Francisco, US&quot;</span>
                  <span className="text-muted-foreground/60">,</span>
                </div>
                <div>
                  <span className="text-blue-300/80">&quot;temperature&quot;</span>
                  <span className="text-muted-foreground/60">: </span>
                  <span className="text-yellow-300/80">72</span>
                  <span className="text-muted-foreground/60">,</span>
                </div>
                <div>
                  <span className="text-blue-300/80">&quot;units&quot;</span>
                  <span className="text-muted-foreground/60">: </span>
                  <span className="text-green-300/80">&quot;fahrenheit&quot;</span>
                  <span className="text-muted-foreground/60">,</span>
                </div>
                <div>
                  <span className="text-blue-300/80">&quot;condition&quot;</span>
                  <span className="text-muted-foreground/60">: </span>
                  <span className="text-green-300/80">&quot;Partly Cloudy&quot;</span>
                </div>
              </div>
              <span className="text-muted-foreground/60">{"}"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const serverCount = await getRegistryCount();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-muted/30 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Built on the official MCP SDK · Open Source
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-5">
            Test any MCP server.{" "}
            <span className="text-primary">Right in your browser.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The interactive playground for Model Context Protocol. Browse
            servers, inspect tools, and run them live — no installation needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Connect a Server
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-accent transition-colors"
            >
              Browse Registry
            </Link>
          </div>
        </div>

        <PlaygroundMockup />
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-muted/20 py-5">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            {[
              { value: `${serverCount}+`, label: "Servers in Registry" },
              { value: "2", label: "Transport Protocols" },
              { value: "0", label: "Installation Required" },
              { value: "MIT", label: "Open Source License" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">How it works</h2>
            <p className="text-muted-foreground">From URL to running tools in under 30 seconds</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Link2 className="h-6 w-6" />,
                title: "Paste a URL",
                description:
                  "Enter any remote MCP server endpoint. Supports Streamable HTTP and SSE transports.",
              },
              {
                step: "02",
                icon: <Layers className="h-6 w-6" />,
                title: "Explore Tools",
                description:
                  "Instantly see every tool, resource, and prompt the server exposes — with full JSON Schema.",
              },
              {
                step: "03",
                icon: <Zap className="h-6 w-6" />,
                title: "Run Live",
                description:
                  "Auto-generated forms from JSON Schema. Fill in parameters and execute tools in real-time.",
              },
            ].map(({ step, icon, title, description }) => (
              <div key={step} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    {icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground/50 tracking-widest mb-1">
                      STEP {step}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Server Authors */}
      <section className="py-16 px-4 border-t border-border/50">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-8 sm:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-4">
                  <Badge className="h-3 w-3" />
                  For Server Authors
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Add a &quot;Try it&quot; badge to your README
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Let your users test your MCP server without any setup. One
                  click from your docs to a live interactive playground.
                </p>
                <div className="flex items-center gap-2">
                  <img
                    src="/badge.svg"
                    alt="Try in MCP Playground"
                    className="h-5"
                  />
                  <span className="text-xs text-muted-foreground">← looks like this</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Add to your README.md:
                </p>
                <div className="rounded-lg bg-background border border-border/50 p-4 font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto">
                  <span className="text-green-400/80">[![</span>
                  <span className="text-blue-300/80">Try in MCP Playground</span>
                  <span className="text-green-400/80">]</span>
                  <span className="text-muted-foreground/60">(</span>
                  <span className="text-yellow-300/70">https://mcpplayground.dev/badge.svg</span>
                  <span className="text-muted-foreground/60">)]</span>
                  <span className="text-muted-foreground/60">(</span>
                  <span className="text-yellow-300/70">https://mcpplayground.dev/playground?url=YOUR_SERVER_URL</span>
                  <span className="text-muted-foreground/60">)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to explore the MCP ecosystem?
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect your first MCP server and start inspecting tools in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Connect a Server
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="https://github.com/sameenchand/mcp-playground"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-accent transition-colors"
            >
              <Github className="h-4 w-4" />
              Star on GitHub
              <Star className="h-3.5 w-3.5 text-yellow-500" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
