import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-6 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Built with ❤️ •{" "}
          <Link
            href="https://registry.modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline underline-offset-4"
          >
            Powered by the Official MCP Registry
          </Link>
        </span>
        <span className="text-xs opacity-60">© {new Date().getFullYear()} MCP Playground</span>
      </div>
    </footer>
  );
}
