import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI & CI Integration — MCP Playground",
  description:
    "Use mcpx to lint MCP servers in your terminal and CI pipeline. Catch schema regressions, enforce grade thresholds, and gate deploys on quality.",
};

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative group rounded-lg bg-muted/20 border border-border/50 overflow-hidden">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton value={code} />
      </div>
      <pre className={`language-${lang} px-4 py-3.5 text-sm font-mono text-foreground overflow-x-auto leading-relaxed`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function CIDocsPage() {
  return (
    <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">CLI &amp; CI Integration</h1>
        <p className="max-w-2xl">
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">@samsec/mcpx</code> is
          a command-line tool that lints MCP servers in your terminal and CI pipelines. It calls the
          MCP Playground API and exits with code <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">1</code> when
          issues are found — making it a drop-in quality gate for any CI system.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <a
            href="https://www.npmjs.com/package/@samsec/mcpx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4"
          >
            <ExternalLink className="h-3 w-3" />
            npm package
          </a>
          <Link href="/docs/api" className="text-xs text-primary hover:underline underline-offset-4">
            Public API docs →
          </Link>
        </div>
      </div>

      <Separator />

      {/* Installation */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Installation</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Run without installing (npx)</p>
            <CodeBlock code="npx @samsec/mcpx lint https://your-server.com/mcp" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Global install</p>
            <CodeBlock code={`npm install -g @samsec/mcpx\nmcpx --version`} />
          </div>
        </div>
      </section>

      {/* Commands */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Commands</h2>
        <div className="space-y-6">

          {/* lint */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              <code className="font-mono">mcpx lint &lt;url&gt;</code>
            </h3>
            <p className="mb-3">Lint a server schema. Exits <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">0</code> on pass, <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">1</code> on fail, <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">2</code> if the server is unreachable.</p>
            <CodeBlock code={`# Default — fail on errors only
mcpx lint https://your-server.com/mcp

# Fail on warnings too
mcpx lint https://your-server.com/mcp --fail-on warnings

# Fail if grade is below B
mcpx lint https://your-server.com/mcp --min-grade B

# Fail if token footprint exceeds budget
mcpx lint https://your-server.com/mcp --token-budget 5000

# JSON output (for scripting)
mcpx lint https://your-server.com/mcp --format json

# Silent — exit code only
mcpx lint https://your-server.com/mcp --quiet`} />
            <div className="mt-3 rounded-lg bg-muted/10 border border-border/40 p-3 text-xs space-y-1">
              <p><code className="font-mono bg-muted px-1 rounded">--fail-on</code> — <code className="font-mono">errors</code> (default) or <code className="font-mono">warnings</code></p>
              <p><code className="font-mono bg-muted px-1 rounded">--min-grade</code> — <code className="font-mono">A</code>, <code className="font-mono">B</code>, <code className="font-mono">C</code>, <code className="font-mono">D</code>, or <code className="font-mono">F</code></p>
              <p><code className="font-mono bg-muted px-1 rounded">--token-budget</code> — integer, fails if total token estimate exceeds this</p>
              <p><code className="font-mono bg-muted px-1 rounded">--format json</code> — machine-readable output</p>
              <p><code className="font-mono bg-muted px-1 rounded">--quiet</code> — no output, just exit code</p>
            </div>
          </div>

          {/* diff */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              <code className="font-mono">mcpx diff --base &lt;url&gt; --head &lt;url&gt;</code>
            </h3>
            <p className="mb-3">Compare two server versions. Fails CI on grade drops, score regressions, or large token increases.</p>
            <CodeBlock code={`mcpx diff \\
  --base https://staging.your-server.com/mcp \\
  --head https://prod.your-server.com/mcp`} />
          </div>

          {/* inspect */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              <code className="font-mono">mcpx inspect &lt;url&gt;</code>
            </h3>
            <p className="mb-3">Show all tools, resources, and prompts a server exposes.</p>
            <CodeBlock code={`mcpx inspect https://your-server.com/mcp
mcpx inspect https://your-server.com/mcp --format json`} />
          </div>

          {/* health */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              <code className="font-mono">mcpx health &lt;url&gt;</code>
            </h3>
            <p className="mb-3">Ping a server and return status + latency.</p>
            <CodeBlock code={`mcpx health https://your-server.com/mcp
mcpx health https://your-server.com/mcp --format json`} />
          </div>
        </div>
      </section>

      {/* GitHub Actions */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-1">GitHub Actions</h2>
        <p className="mb-4">Add schema quality checks to any GitHub workflow:</p>
        <CodeBlock lang="yaml" code={`# .github/workflows/mcp-lint.yml
name: MCP Schema Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lint MCP server
        run: npx @samsec/mcpx lint \${{ secrets.MCP_SERVER_URL }} --min-grade B --token-budget 5000`} />
        <p className="mt-3 text-xs text-muted-foreground">
          Set <code className="font-mono bg-muted px-1 rounded">MCP_SERVER_URL</code> in your repository&apos;s Settings → Secrets and variables → Actions.
        </p>
      </section>

      {/* Exit codes */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Exit Codes</h2>
        <div className="rounded-lg border border-border/50 overflow-hidden text-xs">
          {[
            { code: "0", meaning: "Passed — all checks met" },
            { code: "1", meaning: "Failed — errors found, grade below threshold, or token budget exceeded" },
            { code: "2", meaning: "Unreachable — server could not be contacted or requires authentication" },
          ].map((row, i) => (
            <div key={row.code} className={`flex items-center gap-4 px-4 py-2.5 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
              <code className="font-mono text-foreground w-4 shrink-0">{row.code}</code>
              <span>{row.meaning}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="rounded-xl border border-border/50 bg-muted/10 p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Related</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-3">
          <a
            href="https://www.npmjs.com/package/@samsec/mcpx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline underline-offset-4"
          >
            @samsec/mcpx on npm →
          </a>
          <Link href="/docs/grading" className="text-xs text-primary hover:underline underline-offset-4">
            Grading methodology →
          </Link>
          <Link href="/docs/api" className="text-xs text-primary hover:underline underline-offset-4">
            Public API reference →
          </Link>
          <Link href="/lint" className="text-xs text-primary hover:underline underline-offset-4">
            Interactive schema linter →
          </Link>
        </div>
      </section>
    </div>
  );
}
