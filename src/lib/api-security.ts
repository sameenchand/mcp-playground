/**
 * Shared security utilities for all /api/mcp/* routes.
 * Server-side only.
 */

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(hostname));
}

/**
 * In-memory rate limiter. Returns true if the IP is over the limit.
 * Mutates the provided map to track timestamps.
 */
export function checkRateLimit(
  map: Map<string, number[]>,
  ip: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const timestamps = (map.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  map.set(ip, timestamps);
  return false;
}

/**
 * Validate an MCP server URL. Returns an error string or null.
 */
export function validateMcpUrl(
  url: string,
  blockPrivate: boolean,
): { error: string } | { hostname: string } {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { error: "URL must start with http:// or https://" };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }
  if (blockPrivate && isPrivateHostname(parsed.hostname)) {
    return { error: "Connections to private or local addresses are not allowed." };
  }
  return { hostname: parsed.hostname };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
