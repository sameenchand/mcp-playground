export interface FeaturedServer {
  id: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
  source?: string;
}

export const featuredServers: FeaturedServer[] = [
  {
    id: "everything",
    name: "Everything",
    description:
      "Reference MCP server that exercises all MCP features — tools, resources, prompts, sampling, and more. Perfect for testing the inspector.",
    url: "https://everything.mcp.garden/mcp",
    tags: ["reference", "testing"],
    source:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
  },
  {
    id: "fetch",
    name: "Fetch",
    description:
      "Fetches web content and converts it to Markdown. Useful for giving LLMs access to live web data.",
    url: "https://fetch.mcp.garden/mcp",
    tags: ["web", "fetch", "markdown"],
    source:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
  },
  {
    id: "time",
    name: "Time",
    description:
      "Provides current time and timezone conversion tools. A minimal server great for verifying basic connectivity.",
    url: "https://time.mcp.garden/mcp",
    tags: ["utilities", "time"],
    source:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/time",
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    description:
      "Implements structured, step-by-step reasoning as an MCP tool. Helps LLMs break down complex problems.",
    url: "https://sequentialthinking.mcp.garden/mcp",
    tags: ["reasoning", "thinking"],
    source:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
  },
  {
    id: "local-test",
    name: "Local Test Server",
    description:
      "Our own test MCP server with 4 tools, 2 resources, and 2 prompts. Run it locally to test all inspector features.",
    url: "http://localhost:3001/mcp",
    tags: ["local", "testing", "demo"],
    source: "scripts/test-server.ts",
  },
];
