/**
 * Internal API — POST /api/mcp/lint
 *
 * Used by the /lint page. Connects, inspects, and lints an MCP server.
 * Returns both the inspect result and the lint report.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inspectMcpServer } from "@/lib/mcp-client";
import { lintMcpServer } from "@/lib/schema-linter";
import { checkRateLimit, validateMcpUrl, getClientIp } from "@/lib/api-security";

const rateLimitMap = new Map<string, number[]>();

const RequestSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine(
      (val) =>
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("ws://") ||
        val.startsWith("wss://"),
      "URL must start with http://, https://, ws://, or wss://",
    ),
  headers: z.record(z.string(), z.string()).optional().default({}),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (checkRateLimit(rateLimitMap, ip, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute before trying again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { url, headers } = parsed.data;

  const isProduction = process.env.NODE_ENV === "production";
  const urlCheck = await validateMcpUrl(url, isProduction);
  if ("error" in urlCheck) {
    return NextResponse.json({ error: urlCheck.error }, { status: 400 });
  }

  try {
    const inspectResult = await inspectMcpServer(url, { headers });
    const lintReport = lintMcpServer(inspectResult);

    return NextResponse.json({
      inspect: inspectResult,
      lint: lintReport,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === "TIMEOUT") {
      return NextResponse.json(
        { error: "Server didn't respond within 10 seconds. Is it running?" },
        { status: 408 },
      );
    }
    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "This server requires authentication.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    if (message === "CONNECTION_FAILED") {
      return NextResponse.json(
        { error: "Couldn't reach this server. Check the URL and make sure it's running." },
        { status: 502 },
      );
    }

    console.error("[mcp/lint] Unexpected error:", message);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
