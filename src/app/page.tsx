import Link from "next/link";
import { ArrowRight, Globe, Search, Zap } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import { ServerCard } from "@/components/registry/server-card";
import { fetchServers } from "@/lib/registry-api";

const FEATURED_COUNT = 6;

const HOW_IT_WORKS = [
  {
    icon: Globe,
    step: "01",
    title: "Browse",
    description:
      "Find servers from the official MCP registry — open source tools, APIs, and data sources built by the community.",
  },
  {
    icon: Search,
    step: "02",
    title: "Inspect",
    description:
      "See every tool, resource, and prompt a server exposes. Explore input schemas and understand capabilities at a glance.",
  },
  {
    icon: Zap,
    step: "03",
    title: "Test",
    description:
      "Run tools with real inputs and get real responses live in your browser — no SDK, no config, no installation needed.",
  },
];

export default async function HomePage() {
  const servers = await fetchServers();
  const featured = servers.slice(0, FEATURED_COUNT);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        {/* Subtle gradient backdrop */}
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.4 0.12 240), transparent)",
          }}
        />

        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 sm:py-36 text-center">
          <Badge variant="outline" className="mb-6 text-xs font-mono px-3 py-1">
            Powered by the Official MCP Registry
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Test any MCP server.
            <br />
            <span className="text-muted-foreground font-normal">Right in your browser.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Browse the official registry, inspect tools &amp; resources, and run them live — no
            installation needed.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Link
                href="/explore"
                className="flex items-center pl-9 pr-4 py-2.5 w-full rounded-md border border-border/60 bg-muted/30 text-muted-foreground text-sm hover:border-border hover:bg-muted/50 transition-colors"
              >
                Search MCP servers...
              </Link>
            </div>
            <Link
              href="/explore"
              className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
            >
              Browse all servers <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Servers */}
      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-foreground">Featured Servers</h2>
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="border-t border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <h2 className="text-xl font-semibold text-foreground mb-10 text-center">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground/50 select-none">
                    {step}
                  </span>
                  <div className="p-2 rounded-md bg-muted border border-border/50">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
