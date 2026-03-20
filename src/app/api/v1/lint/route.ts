/**
 * Public API — GET /api/v1/lint?url=
 *
 * Connects to an MCP server, inspects it, and returns a quality report
 * with letter grade, issues, and token estimates.
 *
 * Rate limit: 10 requests/min per IP.
 */

import { NextRequest } from "next/server";
import { inspectMcpServer } from "@/lib/mcp-client";
import { lintMcpServer } from "@/lib/schema-linter";
import { apiResponse, apiError, corsOptions } from "@/lib/api-helpers";
import { checkRateLimit, validateMcpUrl, getClientIp } from "@/lib/api-security";

const rateLimitMap = new Map<string, number[]>();

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);

  if (checkRateLimit(rateLimitMap, ip, 10, 60_000)) {
    return apiError("Rate limit exceeded. Try again in a minute.", "RATE_LIMITED", 429);
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return apiError("Missing required parameter: url", "MISSING_URL", 400);
  }

  // Validate URL
  const isProduction = process.env.NODE_ENV === "production";
  const urlCheck = await validateMcpUrl(url, isProduction);
  if ("error" in urlCheck) {
    return apiError(urlCheck.error, "INVALID_URL", 400);
  }

  try {
    const inspectResult = await inspectMcpServer(url);
    const lintReport = lintMcpServer(inspectResult);

    return apiResponse({
      url,
      server: inspectResult.serverInfo,
      transport: inspectResult.transport,
      grade: lintReport.grade,
      score: lintReport.score,
      tokenEstimate: lintReport.tokenEstimate,
      summary: lintReport.summary,
      issues: lintReport.issues,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === "TIMEOUT") {
      return apiError("Server didn't respond within 10 seconds", "TIMEOUT", 408);
    }
    if (message === "UNAUTHORIZED") {
      return apiError("Server requires authentication", "UNAUTHORIZED", 401);
    }
    if (message === "CONNECTION_FAILED") {
      return apiError("Could not reach the server", "CONNECTION_FAILED", 502);
    }

    console.error("[v1/lint] Unexpected error:", message);
    return apiError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
