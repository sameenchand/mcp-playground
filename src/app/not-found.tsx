import Link from "next/link";
import { ArrowLeft, Search, Plug, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="mb-6">
        <span className="text-8xl font-black text-foreground/10 select-none">404</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        This page doesn&apos;t exist. Were you looking for something specific?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md mb-8">
        {[
          {
            icon: <Plug className="h-4 w-4" />,
            label: "Connect a Server",
            href: "/connect",
            description: "Test a live MCP server",
          },
          {
            icon: <Search className="h-4 w-4" />,
            label: "Browse Registry",
            href: "/explore",
            description: "Explore MCP servers",
          },
          {
            icon: <Home className="h-4 w-4" />,
            label: "Go Home",
            href: "/",
            description: "Back to landing",
          },
        ].map(({ icon, label, href, description }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent transition-colors text-sm"
          >
            <span className="text-muted-foreground">{icon}</span>
            <span className="font-medium text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to MCP Playground
      </Link>
    </div>
  );
}
