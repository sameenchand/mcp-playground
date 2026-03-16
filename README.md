# MCP Playground

**The interactive testing tool for MCP servers. Like Swagger UI for the Model Context Protocol.**

Browse the official registry, connect to any remote server, inspect its tools and resources, execute them live — or run any npm MCP package directly in your browser with zero installation.

[Live Demo](https://mcpplayground.tech) | [MCP Protocol](https://modelcontextprotocol.io)

---

## What It Does

MCP Playground solves a specific problem: there's no easy way to test MCP servers. You either wire up Claude Desktop, use the CLI inspector, or write throwaway scripts. This gives you a web UI where you paste a URL and start testing in seconds.

**Remote servers** — Connect to any MCP server over Streamable HTTP or SSE. The playground auto-generates forms from JSON Schema, executes tool calls, and displays structured results.

**In-browser sandbox** — Most MCP servers in the registry are npm packages with no remote endpoint. The sandbox boots a full Node.js runtime in your browser using WebContainers (WASM), installs the package, and connects via stdio. Everything runs locally. Nothing is sent to our servers.

## Features

- **Registry browser** — Explore servers from the official MCP Registry with metadata, package info, and direct links to test
- **Server inspector** — Connect to any remote MCP server and see its tools, resources, and prompts with full schema definitions
- **Tool execution** — Auto-generated forms from JSON Schema supporting all types: strings, numbers, booleans, enums, nested objects, arrays with dynamic add/remove
- **In-browser sandbox** — Run any npm-based MCP server directly in the browser via WebContainers. No install, no backend, no security risk
- **Session history** — Track and replay previous tool executions within a session
- **Shareable URLs** — Deep-link to a specific server, tool, and pre-filled arguments
- **Embed support** — Embed a live playground on your docs site via iframe, or add a "Try in Playground" badge to your README
- **Auth header support** — Pass custom headers for servers requiring authentication (stored in sessionStorage only, never sent to our backend)

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
[![Try in MCP Playground](https://mcpplayground.dev/badge.svg)](https://mcpplayground.dev/playground?url=YOUR_SERVER_URL)
```

Embed a live demo in your documentation:

```html
<iframe
  src="https://mcpplayground.dev/embed?url=YOUR_SERVER_URL&tool=your_tool"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    api/mcp/              # Server-side MCP proxy endpoints
    playground/           # Remote playground + sandbox routes
    server/[id]/          # Server detail pages
    explore/              # Registry browser
  components/
    playground/           # Tool forms, response viewer, history
    registry/             # Server cards, search, filters
    inspector/            # Connection and inspection UI
    layout/               # Header, footer, sidebar
    ui/                   # shadcn/ui primitives
  lib/
    webcontainer/         # WebContainer manager, transport, React hook
    mcp-client.ts         # Server-side MCP client wrapper
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
