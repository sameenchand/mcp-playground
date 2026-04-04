import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div>
            <p className="font-semibold text-foreground mb-3 text-sm">
              <span className="text-primary">MCP</span> Playground
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The interactive playground for Model Context Protocol. Browse
              servers, inspect tools, and run them live in your browser.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-3 text-sm">Links</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/explore"
                  className="hover:text-foreground transition-colors"
                >
                  Browse Registry
                </Link>
              </li>
              <li>
                <Link
                  href="/connect"
                  className="hover:text-foreground transition-colors"
                >
                  Connect a Server
                </Link>
              </li>
              <li>
                <Link
                  href="/playground"
                  className="hover:text-foreground transition-colors"
                >
                  Playground
                </Link>
              </li>
              <li>
                <Link
                  href="/lint"
                  className="hover:text-foreground transition-colors"
                >
                  Schema Linter
                </Link>
              </li>
              <li>
                <Link
                  href="/quality"
                  className="hover:text-foreground transition-colors"
                >
                  Quality Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="hover:text-foreground transition-colors"
                >
                  Docs
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/ci"
                  className="hover:text-foreground transition-colors"
                >
                  CLI &amp; CI
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-3 text-sm">Resources</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href="https://github.com/sameenchand/mcp-playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub (Playground) →
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/sameenchand/mcpx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub (mcpx CLI) →
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.npmjs.com/package/@samsec/mcpx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  @samsec/mcpx on npm →
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/ci"
                  className="hover:text-foreground transition-colors"
                >
                  CLI &amp; CI Docs →
                </Link>
              </li>
              <li>
                <Link
                  href="https://registry.modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  MCP Registry →
                </Link>
              </li>
              <li>
                <Link
                  href="https://modelcontextprotocol.io/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  MCP Docs →
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} MCP Playground — Not affiliated with
            Anthropic or the MCP project.
          </p>
          <p>
            Built on the{" "}
            <Link
              href="https://registry.modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-4"
            >
              official MCP Registry
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
