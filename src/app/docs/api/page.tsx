import { CopyButton } from "@/components/ui/copy-button";

export const metadata = {
  title: "Public API — MCP Playground Docs",
  description:
    "API reference for MCP Playground's public REST API. Check server health, inspect capabilities, and browse the registry programmatically.",
};

const BASE = "https://mcpplayground.tech";

function Endpoint({
  method,
  path,
  description,
  children,
}: {
  method: string;
  path: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12" id={path.replace(/[/?=&]/g, "-")}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">
          {method}
        </span>
        <code className="text-sm font-mono text-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {children}
    </section>
  );
}

function Param({
  name,
  type,
  required,
  children,
}: {
  name: string;
  type: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2">
      <code className="text-xs font-mono text-primary shrink-0 min-w-[80px]">
        {name}
      </code>
      <div className="flex items-start gap-2 flex-1">
        <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0 mt-0.5">
          {type}
        </span>
        {required && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
            required
          </span>
        )}
        <p className="text-xs text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  return (
    <div className="relative group rounded-lg bg-muted/20 border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
        <span className="text-[11px] font-mono text-muted-foreground/60">
          {language}
        </span>
        <CopyButton value={code} />
      </div>
      <pre className="px-4 py-3.5 text-xs font-mono text-foreground overflow-x-auto whitespace-pre leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <article className="max-w-none">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Reference
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Public API
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          MCP Playground exposes a free, CORS-enabled REST API. Use it to
          check server health in CI, list available tools programmatically,
          or build your own integrations on top of the MCP registry.
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-8 rounded-lg border border-border/40 p-4">
        <p className="text-xs font-medium text-foreground mb-1">Base URL</p>
        <code className="text-sm font-mono text-muted-foreground">
          {BASE}/api/v1
        </code>
      </div>

      {/* Rate limits */}
      <div className="mb-10 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="text-xs font-semibold text-foreground mb-2">
          Rate limits
        </p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">/health</code>{" "}
            — 30 requests per minute per IP
          </p>
          <p>
            <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">/inspect</code>{" "}
            — 10 requests per minute per IP
          </p>
          <p>
            <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">/registry/servers</code>{" "}
            — 20 requests per minute per IP
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Exceeding limits returns <code className="text-xs bg-muted/50 px-1 rounded">429</code> with a{" "}
          <code className="text-xs bg-muted/50 px-1 rounded">RATE_LIMITED</code> error code.
        </p>
      </div>

      {/* Health endpoint */}
      <Endpoint
        method="GET"
        path="/api/v1/health"
        description="Lightweight health check. Pings an MCP server with a minimal initialize request and returns status and latency."
      >
        <h4 className="text-xs font-semibold text-foreground mb-2">
          Query parameters
        </h4>
        <div className="divide-y divide-border/30 mb-4">
          <Param name="url" type="string" required>
            The MCP server URL to check. Supports <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">http(s)://</code> and <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">ws(s)://</code> schemes.
          </Param>
        </div>

        <h4 className="text-xs font-semibold text-foreground mb-2">
          Example request
        </h4>
        <CodeBlock
          language="bash"
          code={`curl "${BASE}/api/v1/health?url=https://mcp.deepwiki.com/mcp"`}
        />

        <h4 className="text-xs font-semibold text-foreground mt-4 mb-2">
          Example response
        </h4>
        <CodeBlock
          code={JSON.stringify(
            {
              ok: true,
              status: "up",
              latencyMs: 342,
              statusCode: 200,
              url: "https://mcp.deepwiki.com/mcp",
              _meta: { api: "v1", docs: `${BASE}/docs/api` },
            },
            null,
            2,
          )}
        />

        <h4 className="text-xs font-semibold text-foreground mt-4 mb-2">
          Status values
        </h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <code className="bg-muted/50 px-1.5 py-0.5 rounded text-green-500">&quot;up&quot;</code>{" "}
            — Server responded successfully
          </p>
          <p>
            <code className="bg-muted/50 px-1.5 py-0.5 rounded text-yellow-500">&quot;auth_required&quot;</code>{" "}
            — Server returned 401 or 403
          </p>
          <p>
            <code className="bg-muted/50 px-1.5 py-0.5 rounded text-red-500">&quot;down&quot;</code>{" "}
            — Server unreachable or returned 5xx
          </p>
        </div>
      </Endpoint>

      {/* Inspect endpoint */}
      <Endpoint
        method="GET"
        path="/api/v1/inspect"
        description="Connect to an MCP server and return all tools, resources, and prompts with their full JSON Schemas."
      >
        <h4 className="text-xs font-semibold text-foreground mb-2">
          Query parameters
        </h4>
        <div className="divide-y divide-border/30 mb-4">
          <Param name="url" type="string" required>
            The MCP server URL to inspect. Supports <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">http(s)://</code> and <code className="text-xs bg-muted/50 px-1 py-0.5 rounded">ws(s)://</code> schemes.
          </Param>
        </div>

        <h4 className="text-xs font-semibold text-foreground mb-2">
          Example request
        </h4>
        <CodeBlock
          language="bash"
          code={`curl "${BASE}/api/v1/inspect?url=https://mcp.deepwiki.com/mcp"`}
        />

        <h4 className="text-xs font-semibold text-foreground mt-4 mb-2">
          Example response (truncated)
        </h4>
        <CodeBlock
          code={JSON.stringify(
            {
              ok: true,
              url: "https://mcp.deepwiki.com/mcp",
              serverInfo: { name: "deepwiki", version: "1.0.0" },
              capabilities: { tools: true, resources: false, prompts: false },
              transport: "streamable-http",
              connectionTimeMs: 523,
              tools: [
                {
                  name: "ask_question",
                  description: "Ask a question about a GitHub repository",
                  inputSchema: { type: "object", properties: { "...": "..." } },
                },
              ],
              resources: [],
              prompts: [],
              _meta: { api: "v1", docs: `${BASE}/docs/api` },
            },
            null,
            2,
          )}
        />

        <div className="mt-4 rounded-lg bg-muted/10 border border-border/40 px-4 py-3 text-xs text-muted-foreground">
          <strong className="text-foreground font-medium">Note:</strong> This
          endpoint does not support auth headers. For servers that require
          authentication, use the Playground UI or{" "}
          <code className="bg-muted/50 px-1 rounded">POST /api/mcp/inspect</code>{" "}
          with headers in the request body.
        </div>
      </Endpoint>

      {/* Registry endpoint */}
      <Endpoint
        method="GET"
        path="/api/v1/registry/servers"
        description="Browse and search the official MCP server registry. Returns server metadata, package info, and remote endpoint URLs."
      >
        <h4 className="text-xs font-semibold text-foreground mb-2">
          Query parameters
        </h4>
        <div className="divide-y divide-border/30 mb-4">
          <Param name="id" type="string">
            Fetch a single server by registry name (e.g.{" "}
            <code className="bg-muted/50 px-1 rounded">deepwiki/deepwiki</code>
            ). Returns a single server object instead of a list.
          </Param>
          <Param name="q" type="string">
            Search by name, description, or ID. Case-insensitive substring match.
          </Param>
          <Param name="remote" type="boolean">
            Set to <code className="bg-muted/50 px-1 rounded">true</code> to
            only return servers that have a remote HTTP endpoint URL.
          </Param>
          <Param name="limit" type="number">
            Results per page. Default: 50, max: 200.
          </Param>
          <Param name="offset" type="number">
            Skip N results for pagination. Default: 0.
          </Param>
        </div>

        <h4 className="text-xs font-semibold text-foreground mb-2">
          Example — list all servers with a remote endpoint
        </h4>
        <CodeBlock
          language="bash"
          code={`curl "${BASE}/api/v1/registry/servers?remote=true&limit=10"`}
        />

        <h4 className="text-xs font-semibold text-foreground mt-4 mb-2">
          Example — search for a server
        </h4>
        <CodeBlock
          language="bash"
          code={`curl "${BASE}/api/v1/registry/servers?q=filesystem&limit=5"`}
        />

        <h4 className="text-xs font-semibold text-foreground mt-4 mb-2">
          Example — fetch a single server by ID
        </h4>
        <CodeBlock
          language="bash"
          code={`curl "${BASE}/api/v1/registry/servers?id=deepwiki/deepwiki"`}
        />

        <h4 className="text-xs font-semibold text-foreground mt-4 mb-2">
          Example response (list)
        </h4>
        <CodeBlock
          code={JSON.stringify(
            {
              ok: true,
              servers: [
                {
                  id: "deepwiki/deepwiki",
                  name: "DeepWiki",
                  description: "Query any GitHub repository docs",
                  remoteUrl: "https://mcp.deepwiki.com/mcp",
                  packages: [{ registry_name: "npm", name: "deepwiki" }],
                },
              ],
              pagination: {
                total: 156,
                limit: 10,
                offset: 0,
                hasMore: true,
              },
              _meta: { api: "v1", docs: `${BASE}/docs/api` },
            },
            null,
            2,
          )}
        />
      </Endpoint>

      {/* Error format */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Error format
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          All error responses follow the same shape:
        </p>
        <CodeBlock
          code={JSON.stringify(
            {
              ok: false,
              error: "Human-readable error message.",
              code: "ERROR_CODE",
              _meta: { api: "v1", docs: `${BASE}/docs/api` },
            },
            null,
            2,
          )}
        />
        <h4 className="text-xs font-semibold text-foreground mt-4 mb-2">
          Error codes
        </h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          {[
            { code: "MISSING_PARAM", status: 400, desc: "A required query parameter is missing." },
            { code: "INVALID_URL", status: 400, desc: "The URL is malformed or points to a private/local address." },
            { code: "UNAUTHORIZED", status: 401, desc: "The server requires authentication." },
            { code: "NOT_FOUND", status: 404, desc: "The requested server was not found in the registry." },
            { code: "TIMEOUT", status: 408, desc: "The server did not respond within the timeout period." },
            { code: "RATE_LIMITED", status: 429, desc: "Too many requests from your IP." },
            { code: "CONNECTION_FAILED", status: 502, desc: "Could not establish a connection to the server." },
            { code: "REGISTRY_ERROR", status: 502, desc: "Failed to fetch data from the upstream MCP registry." },
            { code: "INTERNAL_ERROR", status: 500, desc: "An unexpected server-side error." },
          ].map((item) => (
            <div key={item.code} className="flex gap-3">
              <code className="text-xs font-mono text-primary shrink-0 min-w-[140px]">
                {item.code}
              </code>
              <span className="text-muted-foreground/50 shrink-0 w-8">
                {item.status}
              </span>
              <span>{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Usage examples */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Usage examples
        </h2>

        <h4 className="text-xs font-semibold text-foreground mb-2">
          CI health check (GitHub Actions)
        </h4>
        <CodeBlock
          language="yaml"
          code={`- name: Check MCP server health
  run: |
    STATUS=$(curl -s "${BASE}/api/v1/health?url=\${{ env.MCP_SERVER_URL }}" | jq -r '.status')
    if [ "$STATUS" != "up" ]; then
      echo "MCP server is $STATUS"
      exit 1
    fi`}
        />

        <h4 className="text-xs font-semibold text-foreground mt-6 mb-2">
          List all tools for a server (JavaScript)
        </h4>
        <CodeBlock
          language="javascript"
          code={`const res = await fetch(
  "${BASE}/api/v1/inspect?url=https://mcp.deepwiki.com/mcp"
);
const { tools } = await res.json();
console.log(tools.map(t => t.name));`}
        />

        <h4 className="text-xs font-semibold text-foreground mt-6 mb-2">
          Find servers with remote endpoints (Python)
        </h4>
        <CodeBlock
          language="python"
          code={`import requests

res = requests.get("${BASE}/api/v1/registry/servers", params={
    "remote": "true",
    "limit": 20,
})
for server in res.json()["servers"]:
    print(f"{server['name']}: {server['remoteUrl']}")`}
        />
      </section>
    </article>
  );
}
