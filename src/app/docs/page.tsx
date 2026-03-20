import Link from "next/link";
import {
  BookOpen,
  Plug,
  Box,
  Code2,
  HelpCircle,
  Terminal,
  ArrowRight,
  Braces,
  Sparkles,
  BarChart3,
} from "lucide-react";

export const metadata = {
  title: "Documentation — MCP Playground",
  description:
    "Learn how to use MCP Playground to discover, inspect, and test MCP servers in your browser.",
};

const guides = [
  {
    href: "/docs/getting-started",
    icon: <BookOpen className="h-5 w-5" />,
    title: "Introduction",
    description:
      "What MCP Playground is, how it works, and what you can do with it.",
    badge: "Start here",
  },
  {
    href: "/docs/connecting-servers",
    icon: <Plug className="h-5 w-5" />,
    title: "Connecting Servers",
    description:
      "How to connect to any remote MCP server — including auth headers and transport options.",
  },
  {
    href: "/docs/sandbox",
    icon: <Box className="h-5 w-5" />,
    title: "In-Browser Sandbox",
    description:
      "Run stdio-based npm MCP servers entirely in your browser with no local setup.",
  },
  {
    href: "/docs/embedding",
    icon: <Code2 className="h-5 w-5" />,
    title: "Embedding & Sharing",
    description:
      "Embed an interactive playground in your docs, share reproducible execution links, and use README badges.",
  },
  {
    href: "/docs/local-servers",
    icon: <Terminal className="h-5 w-5" />,
    title: "Local Servers",
    description:
      "Expose a local stdio server over HTTP with supergateway or mcp-proxy so you can test it here.",
  },
  {
    href: "/docs/api",
    icon: <Braces className="h-5 w-5" />,
    title: "Public API",
    description:
      "REST API for checking server health, inspecting capabilities, and browsing the registry programmatically.",
    badge: "New",
  },
  {
    href: "/lint",
    icon: <Sparkles className="h-5 w-5" />,
    title: "Schema Linter",
    description:
      "Grade your MCP server's quality. Check tool descriptions, schema completeness, and estimate token cost.",
  },
  {
    href: "/quality",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Quality Dashboard",
    description:
      "Registry-wide quality leaderboard. Scan every live MCP server, grade them A\u2013F, and export results as CSV.",
    badge: "New",
  },
  {
    href: "/docs/faq",
    icon: <HelpCircle className="h-5 w-5" />,
    title: "FAQ",
    description:
      "Answers to the most common questions about MCP Playground and the Model Context Protocol.",
  },
];

export default function DocsIndexPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Documentation
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          MCP Playground is the fastest way to discover, inspect, and test MCP
          servers — directly in your browser. Use these guides to get the most
          out of it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="group relative flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-5 hover:border-border hover:bg-muted/20 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-primary">{guide.icon}</span>
                <span className="font-semibold text-foreground text-sm">
                  {guide.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {guide.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {guide.badge}
                  </span>
                )}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-8">
              {guide.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border/50 bg-muted/10 p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Need help?
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Something not covered here? Open an issue on GitHub or check the
          official MCP specification.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/sameenchand/mcp-playground/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            Open a GitHub issue →
          </a>
          <a
            href="https://spec.modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            MCP Specification →
          </a>
        </div>
      </div>
    </div>
  );
}
