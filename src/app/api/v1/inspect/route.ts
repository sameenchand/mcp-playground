import { apiResponse, apiError, corsOptions } from "@/lib/api-helpers";
import {
  validateMcpUrl,
  checkRateLimit,
  getClientIp,
} from "@/lib/api-security";
import { inspectMcpServer } from "@/lib/mcp-client";

export const maxDuration = 30;

const rateLimitMap = new Map<string, number[]>();
const isProd = process.env.NODE_ENV === "production";

/**
 * GET /api/v1/inspect?url=<MCP_SERVER_URL>
 *
 * Connect to an MCP server and return all tools, resources, and prompts
 * with their full schemas.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (checkRateLimit(rateLimitMap, ip, 10, 60_000)) {
    return apiError("Rate limit exceeded. Max 10 requests per minute.", "RATE_LIMITED", 429);
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

  try {
    const result = await inspectMcpServer(url);

    return apiResponse({
      url,
      serverInfo: result.serverInfo,
      capabilities: result.capabilities,
      transport: result.transport,
      connectionTimeMs: result.connectionTimeMs,
      tools: result.tools,
      resources: result.resources,
      prompts: result.prompts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === "TIMEOUT") {
      return apiError(
        "Connection timed out. The server did not respond within 10 seconds.",
        "TIMEOUT",
        408,
      );
    }
    if (message === "UNAUTHORIZED") {
      return apiError(
        "Authentication required. This endpoint does not support auth headers — use the playground UI or POST /api/mcp/inspect instead.",
        "UNAUTHORIZED",
        401,
      );
    }
    if (message === "CONNECTION_FAILED") {
      return apiError(
        "Could not connect. Check the URL and make sure the server is running and publicly accessible.",
        "CONNECTION_FAILED",
        502,
      );
    }

    console.error("[api/v1/inspect]", message);
    return apiError("An unexpected error occurred.", "INTERNAL_ERROR", 500);
  }
}

export function OPTIONS() {
  return corsOptions();
}
