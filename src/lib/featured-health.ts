/**
 * Build-time / ISR health check for featured servers.
 * Pings each curated server and caches results for 5 minutes.
 */

import { curatedServers } from "@/lib/featured-servers";

export interface FeaturedServerHealth {
  id: string;
  status: "up" | "down" | "unknown";
  latencyMs: number;
}

let cachedResults: FeaturedServerHealth[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function checkOne(url: string, id: string): Promise<FeaturedServerHealth> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "mcp-playground-health", version: "1.0.0" },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (res.ok || res.status === 401 || res.status === 403) {
      return { id, status: "up", latencyMs };
    }
    return { id, status: "down", latencyMs };
  } catch {
    return { id, status: "down", latencyMs: Date.now() - start };
  }
}

export async function checkFeaturedHealth(): Promise<FeaturedServerHealth[]> {
  if (cachedResults && Date.now() - cachedAt < CACHE_TTL) {
    return cachedResults;
  }

  const results = await Promise.all(
    curatedServers.map((s) => checkOne(s.url, s.id)),
  );

  cachedResults = results;
  cachedAt = Date.now();
  return results;
}
