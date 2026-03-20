import { apiResponse, apiError, corsOptions } from "@/lib/api-helpers";
import {
  validateMcpUrl,
  checkRateLimit,
  getClientIp,
} from "@/lib/api-security";

const rateLimitMap = new Map<string, number[]>();
const isProd = process.env.NODE_ENV === "production";

/**
 * GET /api/v1/health?url=<MCP_SERVER_URL>
 *
 * Lightweight health check — pings the server with a minimal MCP
 * initialize request and returns status + latency.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (checkRateLimit(rateLimitMap, ip, 30, 60_000)) {
    return apiError("Rate limit exceeded. Max 30 requests per minute.", "RATE_LIMITED", 429);
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return apiError("Missing required query parameter: url", "MISSING_PARAM", 400);
  }

  const urlCheck = await validateMcpUrl(url, isProd);
  if ("error" in urlCheck) {
    return apiError(urlCheck.error, "INVALID_URL", 400);
  }

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "mcp-playground-api", version: "1.0.0" },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    let status: "up" | "auth_required" | "down";
    if (res.status === 401 || res.status === 403) {
      status = "auth_required";
    } else if (res.ok || res.status < 500) {
      status = "up";
    } else {
      status = "down";
    }

    return apiResponse({
      status,
      latencyMs,
      statusCode: res.status,
      url,
    });
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Connection timed out after 8 seconds"
        : "Could not reach the server";

    return apiResponse({
      status: "down" as const,
      latencyMs,
      url,
      error: message,
    });
  }
}

export function OPTIONS() {
  return corsOptions();
}
