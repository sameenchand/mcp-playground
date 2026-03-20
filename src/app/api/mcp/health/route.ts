import { NextRequest, NextResponse } from "next/server";
import { validateMcpUrl } from "@/lib/api-security";
import { connectToServer } from "@/lib/mcp-client";

export type HealthStatus = "up" | "auth_required" | "down" | "unknown";

export interface HealthResult {
  status: HealthStatus;
  latencyMs: number;
  statusCode?: number;
}

const TIMEOUT_MS = 8_000;

/**
 * Health check for WebSocket URLs — connects via MCP SDK and immediately closes.
 */
async function checkWebSocketHealth(url: string): Promise<HealthResult> {
  const start = Date.now();
  try {
    const { client } = await connectToServer(url);
    await client.close().catch(() => {});
    return { status: "up", latencyMs: Date.now() - start };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : "";
    if (msg === "TIMEOUT") return { status: "down", latencyMs };
    if (msg === "UNAUTHORIZED") return { status: "auth_required", latencyMs };
    return { status: "down", latencyMs };
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Validate URL + DNS resolution (blocks SSRF)
  const isProduction = process.env.NODE_ENV === "production";
  const urlCheck = await validateMcpUrl(url, isProduction);
  if ("error" in urlCheck) {
    return NextResponse.json({ error: urlCheck.error }, { status: 400 });
  }

  // WebSocket health: connect via SDK, then close
  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    return NextResponse.json(await checkWebSocketHealth(url));
  }

  // HTTP health: lightweight raw fetch
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    // Send a minimal MCP initialize POST — lightweight but tells us the server is alive
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "mcp-playground-health", version: "1.0.0" },
        },
        id: 1,
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - start;

    let status: HealthStatus;
    if (res.status === 401 || res.status === 403) {
      status = "auth_required";
    } else if (res.ok || res.status < 500) {
      status = "up";
    } else {
      status = "down";
    }

    return NextResponse.json({ status, latencyMs, statusCode: res.status } satisfies HealthResult);
  } catch (err) {
    const latencyMs = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json({
      status: isTimeout ? "down" : ("down" satisfies HealthStatus),
      latencyMs,
    } satisfies HealthResult);
  } finally {
    clearTimeout(timer);
  }
}
