import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata = {
  title: "Embedding & Sharing — MCP Playground Docs",
  description:
    "Embed an interactive MCP Playground in your docs, share reproducible execution links, and add a README badge.",
};

const BASE = "https://mcpplayground.tech";

function CodeSnippet({ code, language = "text" }: { code: string; language?: string }) {
  return (
    <div className="relative group rounded-lg bg-muted/20 border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
        <span className="text-[11px] font-mono text-muted-foreground/60">{language}</span>
        <CopyButton value={code} />
      </div>
      <pre className="px-4 py-3.5 text-xs font-mono text-foreground overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export default function EmbeddingPage() {
  const embedUrl = `${BASE}/embed?url=https://mcp.deepwiki.com/mcp`;
  const shareUrl = `${BASE}/playground?url=https://mcp.deepwiki.com/mcp&tool=ask_question&autorun=1`;

  return (
    <article className="max-w-none">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Features
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Embedding &amp; Sharing
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Embed a live playground in your documentation, share reproducible
          execution links with colleagues, and add a README badge so developers
          can test your server with one click.
        </p>
      </div>

      {/* Shareable execution links */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Shareable execution links
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Every execution in the Playground can be shared as a URL that
          auto-connects to the server, selects the tool, pre-fills arguments,
          and optionally auto-executes. Use these in bug reports, docs, or team
          Slack.
        </p>

        <h3 className="text-sm font-semibold text-foreground mb-2">
          URL format
        </h3>
        <CodeSnippet
          language="url"
          code={`${BASE}/playground?url=SERVER_URL&tool=TOOL_NAME&args=BASE64_JSON&autorun=1`}
        />

        <div className="mt-4 space-y-3">
          {[
            {
              param: "url",
              required: true,
              desc: "The MCP server URL to connect to.",
            },
            {
              param: "tool",
              required: false,
              desc: "Pre-selects a specific tool by name.",
            },
            {
              param: "args",
              required: false,
              desc: "Base64-encoded JSON object of tool arguments to pre-fill.",
            },
            {
              param: "autorun",
              required: false,
              desc: 'Set to "1" to auto-execute the tool immediately after connecting. Requires both tool and args.',
            },
          ].map((item) => (
            <div key={item.param} className="flex gap-3">
              <code className="text-xs font-mono text-primary shrink-0 w-16">
                {item.param}
              </code>
              <div className="flex items-start gap-2 flex-1">
                {item.required ? (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                    required
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border/40 shrink-0 mt-0.5">
                    optional
                  </span>
                )}
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">
          Example — pre-filled auto-run link
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          This link opens the DeepWiki server, selects the{" "}
          <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
            ask_question
          </code>{" "}
          tool, and auto-runs immediately:
        </p>
        <CodeSnippet language="url" code={shareUrl} />

        <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">
          Generate a share link in the UI
        </h3>
        <p className="text-xs text-muted-foreground">
          In the Playground, click the{" "}
          <strong className="text-foreground font-medium">Share</strong> button
          in the toolbar. If a result is visible, it generates a link with{" "}
          <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
            autorun=1
          </code>{" "}
          that reproduces your exact execution. Without a result, it generates
          a link that pre-fills the tool and arguments only.
        </p>
      </section>

      {/* Embedded iframe */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Embedding in documentation
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Use the{" "}
          <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
            /embed
          </code>{" "}
          route to embed an interactive Playground in your docs site, README, or
          any page that allows iframes.
        </p>

        <h3 className="text-sm font-semibold text-foreground mb-2">
          Embed URL format
        </h3>
        <CodeSnippet
          language="url"
          code={`${BASE}/embed?url=YOUR_SERVER_URL`}
        />

        <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">
          HTML iframe snippet
        </h3>
        <CodeSnippet
          language="html"
          code={`<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px;"
  allow="clipboard-write"
  title="MCP Playground"
></iframe>`}
        />

        <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">
          MDX / Docusaurus / Nextra
        </h3>
        <CodeSnippet
          language="mdx"
          code={`<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  style={{ border: "none", borderRadius: 12 }}
  allow="clipboard-write"
  title="MCP Playground"
/>`}
        />

        <div className="mt-4 rounded-lg bg-muted/10 border border-border/40 px-4 py-3 text-xs text-muted-foreground">
          <strong className="text-foreground font-medium">Tip:</strong> Pass a{" "}
          <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
            tool=TOOL_NAME
          </code>{" "}
          query param to pre-select a specific tool in the embedded view.
        </div>
      </section>

      {/* README badge */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          README badge
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Add a one-click badge to your server&apos;s README. When clicked, it opens
          MCP Playground pre-connected to your server — instant live demo for
          anyone who finds your repo.
        </p>

        <h3 className="text-sm font-semibold text-foreground mb-2">Markdown</h3>
        <CodeSnippet
          language="markdown"
          code={`[![Open in MCP Playground](${BASE}/badge.svg)](${BASE}/playground?url=YOUR_SERVER_URL)`}
        />

        <h3 className="text-sm font-semibold text-foreground mt-6 mb-2">HTML</h3>
        <CodeSnippet
          language="html"
          code={`<a href="${BASE}/playground?url=YOUR_SERVER_URL">
  <img src="${BASE}/badge.svg" alt="Open in MCP Playground" />
</a>`}
        />

        <div className="mt-4 p-4 rounded-lg border border-border/40 bg-muted/10">
          <p className="text-xs text-muted-foreground mb-3">Preview:</p>
          <img
            src={`${BASE}/badge.svg`}
            alt="Open in MCP Playground badge preview"
            className="h-6"
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/playground"
          className={buttonVariants({ variant: "default" })}
        >
          Open Playground
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Link>
        <a
          href="https://github.com/sameenchand/mcp-playground"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          GitHub
        </a>
      </div>
    </article>
  );
}
