import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI & CI Integration — MCP Playground",
  description:
    "Use @samsec/mcpx to lint MCP servers in your terminal and CI pipeline. Catch schema regressions, enforce grade thresholds, and gate deploys on quality.",
};

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative group rounded-lg bg-muted/20 border border-border/50 overflow-hidden">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton value={code} />
      </div>
      <pre className={`language-${lang} px-4 py-3.5 text-sm font-mono text-foreground overflow-x-auto leading-relaxed whitespace-pre`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function OptionsTable({ rows }: { rows: { flag: string; desc: string; default?: string }[] }) {
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden text-xs mt-3">
      <div className="grid grid-cols-[auto_1fr_auto] bg-muted/20 px-4 py-2 text-muted-foreground/60 font-medium uppercase tracking-wide text-[10px] gap-4">
        <span>Flag</span><span>Description</span><span>Default</span>
      </div>
      {rows.map((row, i) => (
        <div key={row.flag} className={`grid grid-cols-[auto_1fr_auto] items-center px-4 py-2.5 gap-4 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
          <code className="font-mono text-foreground whitespace-nowrap">{row.flag}</code>
          <span className="text-muted-foreground">{row.desc}</span>
          <code className="font-mono text-muted-foreground/60 whitespace-nowrap">{row.default ?? "—"}</code>
        </div>
      ))}
    </div>
  );
}

export default function CIDocsPage() {
  return (
    <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">CLI &amp; CI Integration</h1>
        <p className="max-w-2xl">
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">@samsec/mcpx</code> is
          a command-line tool that lints and inspects MCP servers. It calls the MCP Playground public API
          and exits with a non-zero code when issues are found — making it a drop-in quality gate for
          GitHub Actions, GitLab CI, or any CI system.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <a
            href="https://www.npmjs.com/package/@samsec/mcpx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4"
          >
            <ExternalLink className="h-3 w-3" />
            npm: @samsec/mcpx
          </a>
          <Link href="/docs/grading" className="text-xs text-primary hover:underline underline-offset-4">
            Grading methodology →
          </Link>
          <Link href="/docs/api" className="text-xs text-primary hover:underline underline-offset-4">
            API reference →
          </Link>
        </div>
      </div>

      <Separator />

      {/* Installation */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Installation</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Run without installing</p>
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
        <h2 className="text-lg font-semibold text-foreground mb-6">Commands</h2>
        <div className="space-y-10">

          {/* mcpx lint */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1 font-mono">
              mcpx lint &lt;url&gt;
            </h3>
            <p className="mb-3 text-xs">
              Lint a server schema and return a grade (A–F), score, token estimate, and actionable issues.
              Exits <code className="font-mono bg-muted px-1 rounded">0</code> on pass,{" "}
              <code className="font-mono bg-muted px-1 rounded">1</code> on fail,{" "}
              <code className="font-mono bg-muted px-1 rounded">2</code> if unreachable.
            </p>
            <CodeBlock code={`# Default — fail on errors only
mcpx lint https://your-server.com/mcp

# Fail on warnings too
mcpx lint https://your-server.com/mcp --fail-on warnings

# Require at least a B grade
mcpx lint https://your-server.com/mcp --min-grade B

# Fail if token footprint exceeds 5,000 tokens
mcpx lint https://your-server.com/mcp --token-budget 5000

# Machine-readable JSON (pipeable)
mcpx lint https://your-server.com/mcp --format json | jq '.grade'

# Silent — exit code only (useful in scripts)
mcpx lint https://your-server.com/mcp --quiet && echo "passed"`} />
            <OptionsTable rows={[
              { flag: "--fail-on <level>", desc: "Fail on errors or warnings", default: "errors" },
              { flag: "--min-grade <grade>", desc: "Fail if grade is below A, B, C, D, or F", default: "—" },
              { flag: "--token-budget <n>", desc: "Fail if total token estimate exceeds N", default: "—" },
              { flag: "--format json", desc: "Output raw JSON, no spinner", default: "—" },
              { flag: "--quiet", desc: "No output — just the exit code", default: "—" },
            ]} />
          </div>

          {/* mcpx diff */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1 font-mono">
              mcpx diff --base &lt;url&gt; --head &lt;url&gt;
            </h3>
            <p className="mb-3 text-xs">
              Compare two MCP server versions. Use this in CI to catch quality regressions before they
              reach production — fails if grade dropped, score regressed, or token footprint grew too much.
            </p>
            <CodeBlock code={`mcpx diff \\
  --base https://staging.your-server.com/mcp \\
  --head https://prod.your-server.com/mcp

# With custom thresholds
mcpx diff \\
  --base https://staging.your-server.com/mcp \\
  --head https://prod.your-server.com/mcp \\
  --score-drop 5 \\
  --token-threshold 10

# JSON output
mcpx diff \\
  --base https://staging.your-server.com/mcp \\
  --head https://prod.your-server.com/mcp \\
  --format json`} />
            <OptionsTable rows={[
              { flag: "--base <url>", desc: "Base server URL (required)", default: "—" },
              { flag: "--head <url>", desc: "Head server URL to compare against (required)", default: "—" },
              { flag: "--score-drop <n>", desc: "Fail if score drops more than N points", default: "10" },
              { flag: "--token-threshold <n>", desc: "Fail if token footprint increases more than N%", default: "20" },
              { flag: "--format json", desc: "Output raw JSON", default: "—" },
            ]} />
          </div>

          {/* mcpx inspect */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1 font-mono">
              mcpx inspect &lt;url&gt;
            </h3>
            <p className="mb-3 text-xs">
              Connect to a server and list all tools, resources, and prompts it exposes — with descriptions.
            </p>
            <CodeBlock code={`mcpx inspect https://your-server.com/mcp

# JSON — includes full inputSchema for each tool
mcpx inspect https://your-server.com/mcp --format json`} />
            <OptionsTable rows={[
              { flag: "--format json", desc: "Full JSON output including tool schemas", default: "—" },
            ]} />
          </div>

          {/* mcpx health */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1 font-mono">
              mcpx health &lt;url&gt;
            </h3>
            <p className="mb-3 text-xs">
              Ping a server and return its status and latency. Exits{" "}
              <code className="font-mono bg-muted px-1 rounded">0</code> if up,{" "}
              <code className="font-mono bg-muted px-1 rounded">1</code> if down,{" "}
              <code className="font-mono bg-muted px-1 rounded">2</code> if unreachable.
            </p>
            <CodeBlock code={`mcpx health https://your-server.com/mcp

# JSON output
mcpx health https://your-server.com/mcp --format json`} />
            <OptionsTable rows={[
              { flag: "--format json", desc: "Output JSON with status, latencyMs, url", default: "—" },
            ]} />
          </div>

        </div>
      </section>

      {/* Exit codes */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Exit Codes</h2>
        <div className="rounded-lg border border-border/50 overflow-hidden text-xs">
          {[
            { code: "0", meaning: "Passed — grade meets threshold, no blocking issues" },
            { code: "1", meaning: "Failed — errors found, grade below min-grade, or token budget exceeded" },
            { code: "2", meaning: "Unreachable — server could not be contacted, timed out, or requires auth" },
          ].map((row, i) => (
            <div key={row.code} className={`flex items-center gap-4 px-4 py-2.5 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
              <code className="font-mono text-foreground w-4 shrink-0">{row.code}</code>
              <span>{row.meaning}</span>
            </div>
          ))}
        </div>
      </section>

      {/* GitHub Actions */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">GitHub Actions</h2>
        <p className="mb-4 text-xs">Add a quality gate to any workflow in one step:</p>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Minimal — fail CI on errors</p>
            <CodeBlock lang="yaml" code={`- name: Lint MCP server
  run: npx @samsec/mcpx lint \${{ secrets.MCP_SERVER_URL }}`} />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Full workflow with grade + token gates</p>
            <CodeBlock lang="yaml" code={`# .github/workflows/mcp-lint.yml
name: MCP Schema Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lint MCP server
        run: |
          npx @samsec/mcpx lint \${{ secrets.MCP_SERVER_URL }} \\
            --min-grade B \\
            --token-budget 5000`} />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Diff — catch regressions on PRs</p>
            <CodeBlock lang="yaml" code={`- name: Diff MCP schema
  run: |
    npx @samsec/mcpx diff \\
      --base \${{ secrets.MCP_STAGING_URL }} \\
      --head \${{ secrets.MCP_PROD_URL }} \\
      --score-drop 5 \\
      --token-threshold 10`} />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Add <code className="font-mono bg-muted px-1 rounded">MCP_SERVER_URL</code> in your repository&apos;s{" "}
          Settings → Secrets and variables → Actions.
        </p>
      </section>

      {/* Grading reference */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Grading Reference</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Deductions per issue</p>
            <div className="rounded-lg border border-border/50 overflow-hidden text-xs">
              {[
                { severity: "Error", pts: "−15 pts" },
                { severity: "Warning", pts: "−5 pts" },
                { severity: "Info", pts: "−1 pt" },
              ].map((row, i) => (
                <div key={row.severity} className={`flex justify-between px-4 py-2.5 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                  <span>{row.severity}</span>
                  <code className="font-mono text-muted-foreground">{row.pts}</code>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Grade thresholds</p>
            <div className="rounded-lg border border-border/50 overflow-hidden text-xs">
              {[
                { grade: "A", range: "90–100" },
                { grade: "B", range: "75–89" },
                { grade: "C", range: "60–74" },
                { grade: "D", range: "40–59" },
                { grade: "F", range: "0–39" },
              ].map((row, i) => (
                <div key={row.grade} className={`flex justify-between px-4 py-2.5 ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                  <code className="font-mono text-foreground font-semibold">{row.grade}</code>
                  <span className="text-muted-foreground">{row.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs">
          A server with zero tools, resources, and prompts automatically receives grade F.{" "}
          <Link href="/docs/grading" className="text-primary hover:underline underline-offset-4">
            Full grading methodology →
          </Link>
        </p>
      </section>

      {/* Related */}
      <section className="rounded-xl border border-border/50 bg-muted/10 p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Related</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
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
