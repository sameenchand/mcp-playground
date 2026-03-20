/**
 * MCP connection service — SERVER-SIDE ONLY.
 * Never import this file in client components or pages.
 *
 * Exports:
 *  - connectToServer(url) → ConnectedClient (caller must call client.close())
 *  - inspectMcpServer(url) → InspectResult (manages its own lifecycle)
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { LoggingTransport, type TrafficEntry } from "@/lib/mcp-logging-transport";

export interface ToolSchema {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface ResourceInfo {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface PromptInfo {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface InspectResult {
  serverInfo: {
    name: string;
    version: string;
  };
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  tools: ToolSchema[];
  resources: ResourceInfo[];
  prompts: PromptInfo[];
  transport: "streamable-http" | "sse" | "websocket" | "stdio";
  connectionTimeMs: number;
}

export interface ConnectedClient {
  client: Client;
  transport: "streamable-http" | "sse" | "websocket" | "stdio";
  connectionTimeMs: number;
  /** Captured traffic log (only present when logTraffic was true). */
  trafficLog?: TrafficEntry[];
}

export interface ConnectionOptions {
  /** Custom HTTP headers to send with every MCP request (e.g. auth tokens). */
  headers?: Record<string, string>;
  /** When true, wrap the transport to capture all JSON-RPC messages. */
  logTraffic?: boolean;
}

const CONNECTION_TIMEOUT_MS = 10_000;

async function connectWithTimeout(
  client: Client,
  transport: StreamableHTTPClientTransport | SSEClientTransport | WebSocketClientTransport | LoggingTransport,
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
  try {
    await Promise.race([
      client.connect(transport),
      new Promise<never>((_, reject) =>
        controller.signal.addEventListener("abort", () =>
          reject(new Error("CONNECTION_TIMEOUT")),
        ),
      ),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Returns true if the error looks like an HTTP 401/403 auth failure. */
function isAuthError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("authentication") ||
    lower.includes("invalid or missing credentials") ||
    lower.includes("invalid_token") ||
    lower.includes("access denied")
  );
}

/**
 * Connect to an MCP server and return the live client.
 * The CALLER is responsible for calling client.close() when done.
 * Throws "TIMEOUT", "UNAUTHORIZED", or "CONNECTION_FAILED" on error.
 */
export async function connectToServer(
  url: string,
  options: ConnectionOptions = {},
): Promise<ConnectedClient> {
  const startTime = Date.now();
  const serverUrl = new URL(url);
  const isWebSocket = url.startsWith("ws://") || url.startsWith("wss://");
  const requestInit: RequestInit | undefined =
    options.headers && Object.keys(options.headers).length > 0
      ? { headers: options.headers }
      : undefined;

  let client = new Client({ name: "mcp-playground", version: "1.0.0" });
  let usedTransport: "streamable-http" | "sse" | "websocket" = "streamable-http";
  let logger: LoggingTransport | undefined;

  // ── WebSocket transport (no fallback needed) ──────────────────────
  if (isWebSocket) {
    try {
      const rawWsTransport = new WebSocketClientTransport(serverUrl);
      const wsTransport = options.logTraffic ? new LoggingTransport(rawWsTransport) : rawWsTransport;
      if (wsTransport instanceof LoggingTransport) logger = wsTransport;
      await connectWithTimeout(client, wsTransport);
      usedTransport = "websocket";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "CONNECTION_TIMEOUT") throw new Error("TIMEOUT");
      if (isAuthError(msg)) throw new Error("UNAUTHORIZED");
      throw new Error("CONNECTION_FAILED");
    }

    return {
      client,
      transport: usedTransport,
      connectionTimeMs: Date.now() - startTime,
      ...(logger && { trafficLog: logger.log }),
    };
  }

  // ── HTTP transport: Streamable HTTP → SSE fallback ────────────────
  try {
    const rawTransport = new StreamableHTTPClientTransport(
      serverUrl,
      requestInit ? { requestInit } : undefined,
    );
    const transport = options.logTraffic ? new LoggingTransport(rawTransport) : rawTransport;
    if (transport instanceof LoggingTransport) logger = transport;
    await connectWithTimeout(client, transport);
    usedTransport = "streamable-http";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "CONNECTION_TIMEOUT") throw new Error("TIMEOUT");
    if (isAuthError(msg)) throw new Error("UNAUTHORIZED");

    // Fall back to SSE
    await client.close().catch(() => {});
    client = new Client({ name: "mcp-playground", version: "1.0.0" });
    logger = undefined;

    try {
      const rawSseTransport = new SSEClientTransport(
        serverUrl,
        requestInit ? { requestInit } : undefined,
      );
      const sseTransport = options.logTraffic ? new LoggingTransport(rawSseTransport) : rawSseTransport;
      if (sseTransport instanceof LoggingTransport) logger = sseTransport;
      await connectWithTimeout(client, sseTransport);
      usedTransport = "sse";
    } catch (sseErr) {
      const sseMsg = sseErr instanceof Error ? sseErr.message : String(sseErr);
      if (sseMsg === "CONNECTION_TIMEOUT") throw new Error("TIMEOUT");
      if (isAuthError(sseMsg)) throw new Error("UNAUTHORIZED");
      throw new Error("CONNECTION_FAILED");
    }
  }

  return {
    client,
    transport: usedTransport,
    connectionTimeMs: Date.now() - startTime,
    ...(logger && { trafficLog: logger.log }),
  };
}

/**
 * Connect to an MCP server, inspect it, and return the full inspection result.
 * Manages its own client lifecycle (open + close).
 */
export async function inspectMcpServer(
  url: string,
  options: ConnectionOptions = {},
): Promise<InspectResult> {
  const { client, transport, connectionTimeMs } = await connectToServer(url, options);

  try {
    const serverVersion = client.getServerVersion();
    const serverCapabilities = client.getServerCapabilities();

    const hasTools = !!serverCapabilities?.tools;
    const hasResources = !!serverCapabilities?.resources;
    const hasPrompts = !!serverCapabilities?.prompts;

    const [toolsResult, resourcesResult, promptsResult] = await Promise.all([
      hasTools ? client.listTools() : Promise.resolve({ tools: [] }),
      hasResources ? client.listResources() : Promise.resolve({ resources: [] }),
      hasPrompts ? client.listPrompts() : Promise.resolve({ prompts: [] }),
    ]);

    return {
      serverInfo: {
        name: serverVersion?.name ?? "Unknown Server",
        version: serverVersion?.version ?? "unknown",
      },
      capabilities: { tools: hasTools, resources: hasResources, prompts: hasPrompts },
      tools: toolsResult.tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema as Record<string, unknown>,
      })),
      resources: resourcesResult.resources.map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
      prompts: promptsResult.prompts.map((p) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
      transport,
      connectionTimeMs,
    };
  } finally {
    await client.close().catch(() => {});
  }
}
