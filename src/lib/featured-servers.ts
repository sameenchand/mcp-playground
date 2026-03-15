export interface FeaturedServer {
  id: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
  source?: string;
  requiresAuth?: boolean;
  authNote?: string;
}

export const featuredServers: FeaturedServer[] = [
  {
    id: "local-test",
    name: "Local Test Server",
    description:
      "Our own test MCP server with 4 tools, 2 resources, and 2 prompts. Run it locally with `pnpm test-server` to test all playground features.",
    url: "http://localhost:3001/mcp",
    tags: ["local", "testing", "demo"],
    source: "scripts/test-server.ts",
  },
  {
    id: "deepwiki",
    name: "DeepWiki",
    description:
      "Answers questions about any GitHub repository using AI-powered documentation search. Public endpoint, no auth required.",
    url: "https://mcp.deepwiki.com/mcp",
    tags: ["ai", "documentation", "github"],
    source: "https://deepwiki.com",
  },
  {
    id: "zapier",
    name: "Zapier MCP",
    description:
      "Connect AI agents to 8,000+ apps via Zapier automations. Requires a Zapier account and personal API key.",
    url: "https://mcp.zapier.com/api/mcp/v1",
    tags: ["automation", "integrations"],
    requiresAuth: true,
    authNote: "Requires a Zapier API key passed as a Bearer token",
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
