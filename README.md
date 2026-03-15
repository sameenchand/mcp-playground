# MCP Playground

**Test any MCP server in your browser. No installation needed.**

MCP Playground is the interactive playground for the [Model Context Protocol](https://modelcontextprotocol.io). Browse the official registry, connect to any remote MCP server, inspect its tools and resources, and execute them live with auto-generated forms.

## Features

- **Browse the Registry** — Explore 100+ servers in the official MCP Registry with search and filtering
- **Connect to Any Server** — Paste a URL, connect via Streamable HTTP or SSE (automatic fallback)
- **Inspect Tools, Resources & Prompts** — See full JSON Schema definitions, descriptions, and metadata
- **Run Tools Live** — Auto-generated forms from JSON Schema with all types: string, number, boolean, enum, object, array
- **Session History** — Track and replay previous executions
- **Shareable URLs** — Share playground sessions with base64-encoded arguments
- **Embed Badge** — Add a "Try in Playground" badge to your MCP server's README
- **Iframe Embed** — Embed a live demo on your own docs site

## Quick Start

```bash
# Clone the repo
git clone https://github.com/sameenchand/mcp-playground.git
cd mcp-playground

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Local Test Server

A minimal MCP server for development testing is included:

```bash
pnpm test-server
```

Then connect to `http://localhost:3001/mcp` in the playground. It exposes 4 tools (`greet`, `add`, `get_weather`, `batch_process`), 2 resources, and 2 prompts.

## For MCP Server Authors

Add a "Try in Playground" badge to your README so users can test your server instantly:

```markdown
[![Try in MCP Playground](https://mcpplayground.dev/badge.svg)](https://mcpplayground.dev/playground?url=YOUR_SERVER_URL)
```

Or embed a live demo in your documentation:

```html
<iframe
  src="https://mcpplayground.dev/embed?url=YOUR_SERVER_URL&tool=your_tool"
  width="100%"
  height="600"
  frameborder="0"
/>
```

## Architecture

```
Browser → Next.js API Route → MCP SDK Client → Remote MCP Server
                ↓
Browser ← JSON Response ← API Route ← MCP Server Response
```

- All MCP connections happen **server-side only** — never in the browser
- Only remote transports are supported: **Streamable HTTP** and **SSE** (no stdio)
- URL validation blocks private/localhost addresses in production
- Rate limiting: 20 inspect calls / 10 execute calls per minute per IP
- Timeouts: 10s connection, 30s tool execution

## Tech Stack

- [Next.js 14+](https://nextjs.org) — App Router, Server Components
- [TypeScript](https://www.typescriptlang.org) — Strict mode
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) — Official MCP SDK
- [Zod](https://zod.dev) — Input validation

## Environment Variables

```bash
# .env.local
REGISTRY_API_URL=https://registry.modelcontextprotocol.io
MCP_CONNECTION_TIMEOUT=10000
MCP_EXECUTION_TIMEOUT=30000
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60000
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

## License

MIT — see [LICENSE](./LICENSE)

---

> Not affiliated with Anthropic or the Model Context Protocol project.
