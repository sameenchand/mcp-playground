import { NextRequest, NextResponse } from "next/server";

export type HealthStatus = "up" | "auth_required" | "down" | "unknown";

export interface HealthResult {
  status: HealthStatus;
  latencyMs: number;
  statusCode?: number;
}

const TIMEOUT_MS = 8_000;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https allowed" }, { status: 400 });
  }

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
