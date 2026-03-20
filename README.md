# MCP Playground

**The interactive testing tool for MCP servers. Like Postman for the Model Context Protocol.**

[![Open in MCP Playground](https://mcpplayground.tech/badge.svg)](https://mcpplayground.tech)

Browse the official registry, connect to any remote server, inspect its tools, resources, and prompts, execute them live — or run any npm MCP package directly in your browser with zero installation.

[Live at mcpplayground.tech](https://mcpplayground.tech) | [Documentation](https://mcpplayground.tech/docs) | [MCP Protocol](https://modelcontextprotocol.io)

---

## What It Does

MCP Playground solves a specific problem: there's no easy way to test MCP servers. You either wire up Claude Desktop, use the CLI inspector, or write throwaway scripts. This gives you a web UI where you paste a URL and start testing in seconds.

**Remote servers** — Connect to any MCP server over Streamable HTTP or SSE. The playground auto-generates forms from JSON Schema, executes tool calls, and displays structured results.

**In-browser sandbox** — Most MCP servers in the registry are npm packages with no remote endpoint. The sandbox boots a full Node.js runtime in your browser using WebContainers (WASM), installs the package, and connects via stdio. Everything runs locally. Nothing is sent to our servers.

## Features

- **Registry browser** — Explore servers from the official MCP Registry with metadata, package info, and direct links to test
- **Server inspector** — Connect to any remote MCP server and see its tools, resources, and prompts with full schema definitions
- **Tool execution** — Auto-generated forms from JSON Schema supporting all types: strings, numbers, booleans, enums, nested objects, arrays with dynamic add/remove
- **Resources & Prompts** — Browse server resources with inline content reading, and inspect prompts with argument forms and rendered message previews
- **Traffic Inspector** — See every JSON-RPC message between client and server in real time. Debug protocol-level issues visually
- **In-browser sandbox** — Run any npm-based MCP server directly in the browser via WebContainers. No install, no backend, no security risk
- **Persistent history** — Execution history saved to localStorage per server. Survives page reloads
- **Shareable execution links** — Deep-link to a specific server, tool, and pre-filled arguments. Add `autorun=1` to auto-execute on open
- **Embed support** — Embed a live playground on your docs site via iframe, or add a "Try in Playground" badge to your README
- **Add to IDE** — One-click config generation for Claude Desktop, Cursor/Windsurf, and Claude Code CLI
- **Auth header support** — Pass custom headers for servers requiring authentication (stored in sessionStorage only, never sent to our backend)
- **Form validation** — Required fields validated with inline errors before submission
- **Actionable errors** — Raw error codes mapped to plain-English troubleshooting messages
- **Public API** — Free, CORS-enabled REST API (`/api/v1/`) for health checks, server inspection, and registry search. Use it in CI pipelines or build your own integrations
- **Full documentation** — Seven guide pages covering getting started, connecting, sandbox, embedding, local servers, API reference, and FAQ

## Quick Start

```bash
git clone https://github.com/sameenchand/mcp-playground.git
cd mcp-playground
pnpm install
pnpm dev
```

Open http://localhost:3000.

### Local Test Server

A minimal MCP server is included for development:

```bash
pnpm test-server
```

Connect to `http://localhost:3001/mcp` in the playground. Exposes 4 tools, 2 resources, and 2 prompts.

## Architecture

Two distinct data paths, depending on the server type:

```
Remote servers (HTTP/SSE):
  Browser --> Next.js API Route --> MCP SDK Client --> Remote MCP Server
  Browser <-- JSON Response    <-- API Route       <-- Server Response

In-browser sandbox (stdio):
  Browser --> WebContainer (WASM) --> npm install --> spawn process
  Browser <-- MCP SDK Client      <-- Custom Transport <-- stdio
```

Remote connections happen server-side only — the browser never talks to MCP servers directly. The sandbox is the deliberate exception: WebContainers run in a WASM sandbox with no host network or filesystem access, so all execution stays in the browser.

### Security

- All remote MCP connections happen server-side (never in the browser)
- URL validation blocks private IPs, localhost, and cloud metadata endpoints
- Connection timeout: 10 seconds. Execution timeout: 30 seconds
- Rate limiting: 20 inspect / 10 execute calls per minute per IP
- Response payloads capped at 1MB
- Strict CSP headers on all routes
- Sandbox uses COEP/COOP headers scoped to `/playground/sandbox` only

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, Server Components)
- [TypeScript](https://www.typescriptlang.org) (strict mode)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [@webcontainer/api](https://webcontainers.io) (in-browser Node.js runtime)
- [Zod](https://zod.dev) (input validation)

## For MCP Server Authors

Add a badge to your README so users can test your server instantly:

```markdown
[![Open in MCP Playground](https://mcpplayground.tech/badge.svg)](https://mcpplayground.tech/playground?url=YOUR_SERVER_URL)
```

Embed a live demo in your documentation:

```html
<iframe
  src="https://mcpplayground.tech/embed?url=YOUR_SERVER_URL"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px;"
  allow="clipboard-write"
  title="MCP Playground"
></iframe>
```

Share a reproducible execution link:

```
https://mcpplayground.tech/playground?url=SERVER_URL&tool=TOOL_NAME&args=BASE64_JSON&autorun=1
```

## Public API

MCP Playground exposes a free, CORS-enabled REST API at `https://mcpplayground.tech/api/v1/`:

| Endpoint | Description | Rate Limit |
|----------|-------------|------------|
| `GET /api/v1/health?url=` | Ping an MCP server, get status + latency | 30/min |
| `GET /api/v1/inspect?url=` | Connect and return all tools, resources, prompts | 10/min |
| `GET /api/v1/registry/servers` | Search and browse the MCP server registry | 20/min |

```bash
# Check if a server is up
curl "https://mcpplayground.tech/api/v1/health?url=https://mcp.deepwiki.com/mcp"

# List all tools for a server
curl "https://mcpplayground.tech/api/v1/inspect?url=https://mcp.deepwiki.com/mcp"

# Search the registry
curl "https://mcpplayground.tech/api/v1/registry/servers?q=filesystem&limit=5"
```

Full API documentation: [mcpplayground.tech/docs/api](https://mcpplayground.tech/docs/api)

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    api/mcp/              # Server-side MCP proxy endpoints
    api/v1/               # Public REST API (health, inspect, registry)
    playground/           # Remote playground + sandbox routes
    docs/                 # Documentation pages
    server/[id]/          # Server detail pages
    explore/              # Registry browser
  components/
    playground/           # Tool forms, response viewer, history, traffic inspector
    registry/             # Server cards, search, filters
    inspector/            # Connection and inspection UI
    docs/                 # Documentation sidebar nav
    layout/               # Header, footer, sidebar
    ui/                   # shadcn/ui primitives
  lib/
    webcontainer/         # WebContainer manager, transport, React hook
    mcp-client.ts         # Server-side MCP client wrapper
    mcp-logging-transport.ts  # Transport wrapper for traffic capture
    featured-servers.ts   # Curated server lists
```

## Environment Variables

```bash
# .env.local (all optional — sensible defaults are built in)
REGISTRY_API_URL=https://registry.modelcontextprotocol.io
MCP_CONNECTION_TIMEOUT=10000
MCP_EXECUTION_TIMEOUT=30000
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push and open a Pull Request

## License

MIT

---

Not affiliated with Anthropic or the Model Context Protocol project.
