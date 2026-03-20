import Link from "next/link";
import { ArrowRight, Terminal, AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata = {
  title: "In-Browser Sandbox — MCP Playground Docs",
  description:
    "Run any stdio-based npm MCP server entirely in your browser using WebContainers — no local setup required.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-4 py-2.5 my-3">
      <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <code className="flex-1 text-sm font-mono text-foreground break-all">
        {children}
      </code>
      <CopyButton value={children} />
    </div>
  );
}

export default function SandboxPage() {
  return (
    <article className="max-w-none">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Features
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          In-Browser Sandbox
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          The Sandbox lets you run any stdio-based npm MCP server entirely
          in your browser — no local Node.js, no terminal, no setup.
        </p>
      </div>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          How it works
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The Sandbox is powered by{" "}
          <a
            href="https://webcontainers.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-4"
          >
            WebContainers
          </a>{" "}
          — a WASM-based Node.js runtime that runs entirely in your browser tab.
          When you provide an npm package name:
        </p>
        <div className="space-y-3 mb-4">
          {[
            {
              step: "1",
              title: "Boot",
              body: "WebContainers initializes a WASM-based Node.js environment in your browser. This takes ~5–10 seconds on first load.",
            },
            {
              step: "2",
              title: "Install",
              body: "npm installs the package you specify (e.g. @modelcontextprotocol/server-filesystem). Dependencies are downloaded from the npm registry.",
            },
            {
              step: "3",
              title: "Spawn",
              body: "The server process is started with the arguments you provide. A custom MCP transport bridges stdin/stdout to the MCP SDK client in your browser.",
            },
            {
              step: "4",
              title: "Interact",
              body: "The Playground appears with all tools, resources, and prompts from the running server. Everything stays in your browser tab.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <span className="text-lg font-bold text-primary/30 tabular-nums w-5 shrink-0 leading-tight mt-0.5">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-muted/20 border border-border/50 px-4 py-3.5 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre leading-loose">
          {`Browser → WebContainer (WASM) → npm install → spawn process
                                                   ↓
Browser ← MCP SDK Client (browser) ← WebContainerTransport ← stdio`}
        </div>
      </section>

      {/* How to use it */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Using the Sandbox
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Navigate to{" "}
          <Link
            href="/playground/sandbox"
            className="text-primary hover:underline underline-offset-4"
          >
            /playground/sandbox
          </Link>{" "}
          and enter:
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border border-border/40 p-4">
            <p className="text-xs font-medium text-foreground mb-1">
              Package name (required)
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Any npm package that implements an MCP stdio server.
            </p>
            <CodeBlock>@modelcontextprotocol/server-filesystem</CodeBlock>
          </div>
          <div className="rounded-lg border border-border/40 p-4">
            <p className="text-xs font-medium text-foreground mb-1">
              Arguments (optional)
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Arguments passed to the server process. Separate with spaces.
            </p>
            <CodeBlock>/tmp</CodeBlock>
          </div>
        </div>
      </section>

      {/* Example packages */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Example packages to try
        </h2>
        <div className="space-y-3">
          {[
            {
              pkg: "@modelcontextprotocol/server-filesystem",
              args: "/tmp",
              desc: "File system access — read, write, list files in a directory.",
            },
            {
              pkg: "@modelcontextprotocol/server-memory",
              args: "",
              desc: "In-memory key-value store. Useful for testing persistence tools.",
            },
            {
              pkg: "@modelcontextprotocol/server-everything",
              args: "",
              desc: "A demo server with every tool type — great for testing form generation.",
            },
          ].map((item) => (
            <div key={item.pkg} className="rounded-lg border border-border/40 p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <code className="text-xs font-mono text-foreground">
                  {item.pkg}
                </code>
                {item.args && (
                  <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                    args: {item.args}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security note */}
      <section className="mb-10">
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-5">
          <div className="flex gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <h2 className="text-sm font-semibold text-foreground">
              Security model
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            The Sandbox is a deliberate security exception to MCP Playground&apos;s
            rule of &quot;never connect to MCP servers from client-side code.&quot; It is
            safe because:
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {[
              "WebContainers run in a WASM sandbox with no access to your host filesystem or network",
              "Everything executes inside your browser tab — nothing is sent to our servers",
              "The sandbox is isolated from the rest of the page via COEP/COOP headers",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-yellow-500 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Limitations */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Limitations
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Only npm packages — Python (pypi) servers are not supported",
            "Packages with native C++ addons (node-gyp) will not install",
            "First boot is slower (~5–10 seconds) due to WASM initialization + npm install",
            "The sandbox state is reset when you close or reload the tab",
            "Some packages may not expose a binary that can be executed as a server",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-muted-foreground/40 shrink-0">×</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/playground/sandbox"
          className={buttonVariants({ variant: "default" })}
        >
          Open the Sandbox
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Link>
        <Link
          href="/docs/local-servers"
          className={buttonVariants({ variant: "outline" })}
        >
          Local Servers Guide
        </Link>
      </div>
    </article>
  );
}
