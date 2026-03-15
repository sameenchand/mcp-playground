/**
 * Local test MCP server for developing the inspector.
 *
 * Run: pnpm tsx scripts/test-server.ts
 * Endpoint: http://localhost:3001/mcp
 *
 * Exposes dummy tools, resources, and prompts to test
 * the inspector UI with various JSON Schema shapes.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createServer, type IncomingMessage } from "node:http";
import { randomUUID } from "node:crypto";

// Create a fresh McpServer instance per connection — the SDK does not allow
// a single Server to be connected to multiple transports simultaneously.
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "test-playground-server",
    version: "1.0.0",
  });

  // --- Tools ---

  server.registerTool("greet", {
    title: "Greet",
    description: "Returns a personalized greeting message.",
    inputSchema: {
      name: z.string().describe("The name of the person to greet"),
    },
  }, async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}! Welcome to MCP Playground.` }],
  }));

  server.registerTool("add", {
    title: "Add Numbers",
    description: "Adds two numbers together and returns the sum.",
    inputSchema: {
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
  }, async ({ a, b }) => ({
    content: [{ type: "text", text: `${a} + ${b} = ${a + b}` }],
  }));

  server.registerTool("get_weather", {
    title: "Get Weather",
    description: "Fetches weather data for a given location. Returns mock data for testing.",
    inputSchema: {
      location: z.object({
        city: z.string().describe("City name"),
        state: z.string().optional().describe("State or province (optional)"),
        country: z.string().default("US").describe("ISO country code"),
      }).describe("The location to get weather for"),
      units: z.enum(["celsius", "fahrenheit"]).default("fahrenheit").describe("Temperature unit"),
      include_forecast: z.boolean().default(false).describe("Whether to include 5-day forecast"),
    },
  }, async ({ location, units, include_forecast }) => {
    const temp = units === "celsius" ? 22 : 72;
    const result: Record<string, unknown> = {
      location: `${location.city}${location.state ? `, ${location.state}` : ""}, ${location.country}`,
      temperature: temp,
      units,
      condition: "Partly Cloudy",
      humidity: 65,
      wind_speed: 12,
    };
    if (include_forecast) {
      result.forecast = [
        { day: "Mon", high: temp + 2, low: temp - 5, condition: "Sunny" },
        { day: "Tue", high: temp + 1, low: temp - 4, condition: "Cloudy" },
        { day: "Wed", high: temp - 1, low: temp - 6, condition: "Rain" },
      ];
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("batch_process", {
    title: "Batch Process",
    description: "Processes a batch of items. Demonstrates array input handling.",
    inputSchema: {
      items: z.array(z.string()).min(1).max(10).describe("List of items to process"),
      operation: z.enum(["uppercase", "lowercase", "reverse"]).describe("Operation to apply"),
    },
  }, async ({ items, operation }) => {
    const processed = items.map((item) => {
      switch (operation) {
        case "uppercase": return item.toUpperCase();
        case "lowercase": return item.toLowerCase();
        case "reverse": return item.split("").reverse().join("");
      }
    });
    return { content: [{ type: "text", text: JSON.stringify({ processed }, null, 2) }] };
  });

  // --- Resources ---

  server.registerResource(
    "server-info",
    "info://server",
    {
      title: "Server Info",
      description: "Information about this test MCP server",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify({
          name: "test-playground-server",
          purpose: "Testing MCP Playground inspector",
          tools_count: 4,
          uptime: process.uptime(),
        }, null, 2),
      }],
    }),
  );

  server.registerResource(
    "user-profile",
    new ResourceTemplate("user://{userId}/profile", { list: undefined }),
    {
      title: "User Profile",
      description: "Dynamic user profile resource (templated URI)",
      mimeType: "application/json",
    },
    async (uri, { userId }) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify({ userId, name: `User ${userId}`, role: "developer" }, null, 2),
      }],
    }),
  );

  // --- Prompts ---

  server.registerPrompt("code_review", {
    title: "Code Review",
    description: "Generates a prompt for reviewing code with specific focus areas.",
    arguments: [
      { name: "language", description: "Programming language", required: true },
      { name: "focus", description: "Review focus: security, performance, or readability", required: false },
    ],
  }, async ({ language, focus }) => ({
    messages: [{
      role: "user" as const,
      content: { type: "text" as const, text: `Review the following ${language} code${focus ? ` with focus on ${focus}` : ""}:` },
    }],
  }));

  server.registerPrompt("explain_concept", {
    title: "Explain Concept",
    description: "Generates a prompt to explain a technical concept at a specific level.",
    arguments: [
      { name: "concept", description: "The concept to explain", required: true },
      { name: "level", description: "beginner, intermediate, or advanced", required: true },
    ],
  }, async ({ concept, level }) => ({
    messages: [{
      role: "user" as const,
      content: { type: "text" as const, text: `Explain "${concept}" at a ${level} level.` },
    }],
  }));

  return server;
}

// --- HTTP Server Setup ---

const PORT = 3001;

// Session registry: maps session ID -> transport so subsequent requests
// within the same MCP session are routed to the correct transport instance.
const sessions = new Map<string, StreamableHTTPServerTransport>();

async function readBody(req: IncomingMessage): Promise<unknown> {
  if (req.method !== "POST") return undefined;
  const raw = await new Promise<string>((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => resolve(body));
  });
  try { return JSON.parse(raw); } catch { return undefined; }
}

const httpServer = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!(req.url === "/mcp" || req.url?.startsWith("/mcp?"))) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use /mcp endpoint." }));
    return;
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  // Route an existing session's requests to its transport
  if (sessionId) {
    const existing = sessions.get(sessionId);
    if (existing) {
      const body = await readBody(req);
      await existing.handleRequest(req, res, body);
      return;
    }
    // Unknown session — client may be stale; reject cleanly
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Session not found." }));
    return;
  }

  // No session ID → new connection. Create a fresh transport + server pair.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (newId) => {
      sessions.set(newId, transport);
    },
    onsessionclosed: (closedId) => {
      sessions.delete(closedId);
    },
  });

  const server = createMcpServer();
  await server.connect(transport);

  const body = await readBody(req);
  await transport.handleRequest(req, res, body);
});

httpServer.listen(PORT, () => {
  console.log(`\n🧪 Test MCP server running at http://localhost:${PORT}/mcp`);
  console.log(`\n   Tools:     greet, add, get_weather, batch_process`);
  console.log(`   Resources: server-info, user-profile`);
  console.log(`   Prompts:   code_review, explain_concept\n`);
});
