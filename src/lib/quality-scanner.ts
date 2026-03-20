/**
 * Quality Scanner — batch-inspects and lints MCP servers.
 * Server-side only. Used by the /api/mcp/scan-batch route.
 */

import { inspectMcpServer } from "@/lib/mcp-client";
import { lintMcpServer } from "@/lib/schema-linter";
import type { LintReport } from "@/lib/schema-linter";

const SCAN_TIMEOUT_MS = 8_000;

export interface ScanResult {
  url: string;
  name: string;
  grade: LintReport["grade"];
  score: number;
  toolCount: number;
  resourceCount: number;
  promptCount: number;
  issueCount: number;
  transport: string;
  connectionTimeMs: number;
  error?: string;
}

/**
 * Inspect + lint a single MCP server with a timeout.
 * Returns a ScanResult regardless of success or failure.
 */
async function scanSingleServer(url: string): Promise<ScanResult> {
  const fallback: ScanResult = {
    url,
    name: "Unknown",
    grade: "F",
    score: 0,
    toolCount: 0,
    resourceCount: 0,
    promptCount: 0,
    issueCount: 0,
    transport: "unknown",
    connectionTimeMs: 0,
  };

  try {
    const result = await Promise.race([
      inspectMcpServer(url),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SCAN_TIMEOUT")), SCAN_TIMEOUT_MS),
      ),
    ]);

    const lint = lintMcpServer(result);

    return {
      url,
      name: result.serverInfo.name,
      grade: lint.grade,
      score: lint.score,
      toolCount: result.tools.length,
      resourceCount: result.resources.length,
      promptCount: result.prompts.length,
      issueCount: lint.issues.length,
      transport: result.transport,
      connectionTimeMs: result.connectionTimeMs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...fallback,
      error:
        message === "SCAN_TIMEOUT"
          ? "Server timed out (8s)"
          : message === "TIMEOUT"
            ? "Connection timed out (10s)"
            : message === "UNAUTHORIZED"
              ? "Requires authentication"
              : message === "CONNECTION_FAILED"
                ? "Connection failed"
                : "Scan failed",
    };
  }
}

/**
 * Scan a batch of up to 3 MCP server URLs in parallel.
 * Each server is individually wrapped with a timeout.
 * Returns results for all servers (including failures).
 */
export async function scanServerBatch(urls: string[]): Promise<ScanResult[]> {
  const batch = urls.slice(0, 3);
  const settled = await Promise.allSettled(batch.map(scanSingleServer));

  return settled.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    return {
      url: batch[i] ?? "unknown",
      name: "Unknown",
      grade: "F" as const,
      score: 0,
      toolCount: 0,
      resourceCount: 0,
      promptCount: 0,
      issueCount: 0,
      transport: "unknown",
      connectionTimeMs: 0,
      error: "Unexpected error",
    };
  });
}
