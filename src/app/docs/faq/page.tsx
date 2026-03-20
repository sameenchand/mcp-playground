import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";

export const metadata = {
  title: "FAQ — MCP Playground Docs",
  description:
    "Frequently asked questions about MCP Playground and the Model Context Protocol.",
};

const faqs = [
  {
    q: "Is MCP Playground free to use?",
    a: "Yes, MCP Playground is completely free and open-source. There are no accounts, no rate limits for browsing, and no paywalls. Tool execution is rate-limited to 10 calls per minute per IP to protect server stability.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. MCP Playground runs entirely in your browser. The only exception is the In-Browser Sandbox, which downloads npm packages on demand — but that still requires no local setup.",
  },
  {
    q: "Where are my auth headers stored?",
    a: "Auth headers you enter on the Connect page are stored in sessionStorage in your browser only. They exist for the duration of your browser session and are never persisted to our servers. They are sent in the POST body of our API routes and forwarded to the MCP server.",
  },
  {
    q: "Why can't I connect to localhost?",
    a: "For security, MCP Playground blocks connections to localhost and private IP ranges (10.x.x.x, 192.168.x.x, etc.) in production. This prevents server-side request forgery (SSRF) attacks. To test a local server, use supergateway or mcp-proxy to expose it over a public URL, or run MCP Playground locally from source.",
  },
  {
    q: "What MCP transports are supported?",
    a: "MCP Playground supports Streamable HTTP, SSE (Server-Sent Events), and WebSocket (ws:// / wss://) transports. For HTTP URLs it tries Streamable HTTP first and automatically falls back to SSE. WebSocket URLs are connected directly. stdio transport is not directly supported — use supergateway or the built-in Sandbox instead.",
  },
  {
    q: "My server isn't in the registry. Can I still use it?",
    a: 'Yes. The registry browser (/explore) shows servers from the official MCP registry, but that\'s separate from the Playground. You can connect to any remote MCP server by pasting its URL on the /connect page — it doesn\'t need to be registered anywhere.',
  },
  {
    q: "The registry shows my server but I can't connect to it directly. Why?",
    a: "Most servers in the MCP registry are stdio-based packages meant for local installation — they don't have remote HTTP endpoints. The registry stores metadata (npm package name, description) but not live URLs. To use those servers, install them locally and expose them via supergateway, or use the In-Browser Sandbox for npm packages.",
  },
  {
    q: "How does the form generator work?",
    a: "When you select a tool, MCP Playground reads its inputSchema (a JSON Schema object) and auto-generates a typed form. Text fields, number inputs, booleans (toggles), enums (dropdowns), arrays, and nested objects are all supported. Required fields are validated before submission.",
  },
  {
    q: "Can I share a link that auto-runs a tool?",
    a: 'Yes. After running a tool, click the "Share" button in the Playground toolbar. It generates a URL with the server, tool, arguments (base64-encoded), and autorun=1 — opening the link will auto-connect and execute the tool immediately.',
  },
  {
    q: "Can I embed MCP Playground in my docs?",
    a: "Yes. Use the /embed route with your server URL as a query parameter inside an iframe. See the Embedding & Sharing guide for code snippets.",
    link: { href: "/docs/embedding", label: "Embedding guide →" },
  },
  {
    q: "Does MCP Playground support WebSocket transport?",
    a: "Yes! You can connect to MCP servers over ws:// or wss:// — just paste the WebSocket URL on the Connect page. MCP Playground uses the official MCP SDK's WebSocketClientTransport under the hood.",
  },
  {
    q: "What is the Quality Dashboard?",
    a: "The Quality Dashboard (/quality) scans every live MCP server in the registry and grades them A\u2013F using the same Schema Linter rules. It shows a sortable leaderboard with grade distribution, search, filtering, and CSV export. Scans run progressively in your browser and results are cached locally for 24 hours.",
    link: { href: "/quality", label: "Quality Dashboard \u2192" },
  },
  {
    q: "Can I run Python MCP servers in the Sandbox?",
    a: "Not currently. The In-Browser Sandbox uses WebContainers, which only supports Node.js. Python/pypi servers are not supported in the browser sandbox. To test Python servers, run them locally and expose via HTTP.",
  },
  {
    q: "Is MCP Playground affiliated with Anthropic?",
    a: "No. MCP Playground is an independent, community-built tool. It is not officially affiliated with or endorsed by Anthropic. The Model Context Protocol itself is an open standard maintained by Anthropic.",
  },
  {
    q: "How do I report a bug or request a feature?",
    a: "Open an issue on GitHub. Pull requests are also welcome.",
    link: {
      href: "https://github.com/sameenchand/mcp-playground/issues",
      label: "GitHub Issues →",
      external: true,
    },
  },
];

export default function FaqPage() {
  return (
    <article className="max-w-none">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Reference
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Common questions about MCP Playground and the Model Context Protocol.
        </p>
      </div>

      <div className="space-y-0 divide-y divide-border/40">
        {faqs.map((faq) => (
          <div key={faq.q} className="py-6 first:pt-0">
            <h2 className="text-sm font-semibold text-foreground mb-2">
              {faq.q}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {faq.a}
            </p>
            {faq.link && (
              <div className="mt-2">
                {faq.link.external ? (
                  <a
                    href={faq.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
                  >
                    {faq.link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link
                    href={faq.link.href}
                    className="text-xs text-primary hover:underline underline-offset-4"
                  >
                    {faq.link.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border/50 bg-muted/10 p-6">
        <p className="text-sm font-medium text-foreground mb-1">
          Still have questions?
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Check the full documentation or open an issue on GitHub.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs"
            className={buttonVariants({ variant: "default" })}
          >
            Browse Docs
          </Link>
          <a
            href="https://github.com/sameenchand/mcp-playground/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            GitHub Issues
          </a>
        </div>
      </div>
    </article>
  );
}
