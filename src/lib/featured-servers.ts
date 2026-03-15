export interface FeaturedServer {
  id: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
  source?: string;
  requiresAuth?: boolean;
  authNote?: string;
  /** A specific tool to highlight / pre-select in the playground */
  highlightTool?: string;
  /** Short example description of what the server does */
  tryPrompt?: string;
}

export const featuredServers: FeaturedServer[] = [
  {
    id: "local-test",
    name: "Local Test Server",
    description:
      "A test MCP server with 4 tools (greet, add, get_weather, batch_process), 2 resources, and 2 prompts. Run locally with `pnpm test-server`.",
    url: "http://localhost:3001/mcp",
    tags: ["local", "testing", "demo"],
    source: "scripts/test-server.ts",
    highlightTool: "get_weather",
    tryPrompt: "Try the get_weather tool with a city name",
  },
  {
    id: "deepwiki",
    name: "DeepWiki",
    description:
      "Ask questions about any public GitHub repository using AI-powered documentation search. No auth required.",
    url: "https://mcp.deepwiki.com/mcp",
    tags: ["ai", "documentation", "github"],
    source: "https://deepwiki.com",
    highlightTool: "ask_question",
    tryPrompt: "Ask anything about a GitHub repo — try 'vercel/next.js'",
  },
  {
    id: "petstore",
    name: "Petstore API",
    description:
      "The classic Swagger Petstore API exposed as MCP tools. Great for testing form types and API patterns. No auth needed.",
    url: "https://petstore.run.mcp.com.ai/mcp",
    tags: ["api", "testing", "demo"],
    source: "https://mcp.com.ai",
    highlightTool: "getPetById",
    tryPrompt: "Fetch a pet by ID or list available pets",
  },
  {
    id: "mcp-registry",
    name: "MCP Registry",
    description:
      "Browse and search the official MCP Registry as MCP tools. Discover servers programmatically.",
    url: "https://registry.run.mcp.com.ai/mcp",
    tags: ["registry", "discovery"],
    source: "https://mcp.com.ai",
    tryPrompt: "Search the MCP registry for servers",
  },
  {
    id: "jina-ai",
    name: "Jina AI",
    description:
      "Web search, URL reading, and content extraction powered by Jina AI. Generous free tier, no auth needed for basic use.",
    url: "https://mcp.jina.ai/v1",
    tags: ["ai", "search", "web"],
    source: "https://github.com/jina-ai/MCP",
    highlightTool: "readUrl",
    tryPrompt: "Read and extract content from any URL",
  },
  {
    id: "zapier",
    name: "Zapier MCP",
    description:
      "Connect AI agents to 8,000+ apps via Zapier automations. Requires a Zapier account and personal API key.",
    url: "https://mcp.zapier.com/api/mcp/v1",
    tags: ["automation", "integrations"],
    requiresAuth: true,
    authNote: "Requires a Zapier API key as a Bearer token",
    source: "https://zapier.com/mcp",
  },
  {
    id: "linear",
    name: "Linear MCP",
    description:
      "Query and manage Linear issues, projects, and teams. Requires a Linear OAuth token.",
    url: "https://mcp.linear.app/sse",
    tags: ["project-management", "issues"],
    requiresAuth: true,
    authNote: "Requires a Linear OAuth access token",
    source: "https://linear.app",
  },
];

/** Servers confirmed to work publicly with no auth — shown in the landing page "Try now" section */
export const curatedServers = featuredServers.filter(
  (s) => !s.requiresAuth && s.id !== "local-test",
);
