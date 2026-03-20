import { apiResponse, apiError, corsOptions } from "@/lib/api-helpers";
import { checkRateLimit, getClientIp } from "@/lib/api-security";
import { fetchServers, fetchServerById } from "@/lib/registry-api";

const rateLimitMap = new Map<string, number[]>();

/**
 * GET /api/v1/registry/servers
 * GET /api/v1/registry/servers?id=<SERVER_ID>
 * GET /api/v1/registry/servers?q=<SEARCH>&limit=<N>&offset=<N>
 *
 * Browse the official MCP Registry. Returns server metadata, package info,
 * and remote endpoint URLs where available.
 *
 * Params:
 *   id     — Fetch a single server by its registry name (e.g. "deepwiki/deepwiki")
 *   q      — Search servers by name or description (case-insensitive substring)
 *   limit  — Max results per page (default 50, max 200)
 *   offset — Number of results to skip (default 0)
 *   remote — Set to "true" to only return servers with a remote HTTP endpoint
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (checkRateLimit(rateLimitMap, ip, 20, 60_000)) {
    return apiError("Rate limit exceeded. Max 20 requests per minute.", "RATE_LIMITED", 429);
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // Single server lookup
  if (id) {
    const server = await fetchServerById(id);
    if (!server) {
      return apiError(`Server "${id}" not found in the registry.`, "NOT_FOUND", 404);
    }
    return apiResponse({ server });
  }

  // List / search
  const q = searchParams.get("q")?.toLowerCase().trim() ?? "";
  const remoteOnly = searchParams.get("remote") === "true";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

  try {
    let servers = await fetchServers();

    // Filter: search query
    if (q) {
      servers = servers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      );
    }

    // Filter: remote only
    if (remoteOnly) {
      servers = servers.filter((s) => !!s.remoteUrl);
    }

    const total = servers.length;
    const paginated = servers.slice(offset, offset + limit);

    return apiResponse({
      servers: paginated,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[api/v1/registry/servers]", err);
    return apiError("Failed to fetch servers from the registry.", "REGISTRY_ERROR", 502);
  }
}

export function OPTIONS() {
  return corsOptions();
}
