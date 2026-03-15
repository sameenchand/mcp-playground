/**
 * Shared security utilities for all /api/mcp/* routes.
 * Server-side only.
 */

import { resolve4, resolve6 } from "node:dns/promises";

/**
 * Check if an IP address is private, loopback, link-local, or a cloud metadata endpoint.
 * Covers IPv4 and IPv6.
 */
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,                          // IPv4 loopback
  /^10\./,                           // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,     // RFC 1918
  /^192\.168\./,                     // RFC 1918
  /^169\.254\./,                     // Link-local + AWS/GCP/Azure metadata
  /^0\./,                            // "This network"
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./, // Carrier-grade NAT (RFC 6598)
  /^198\.1[89]\./,                   // Benchmarking (RFC 2544)
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 unique local
  /^fd/i,                            // IPv6 unique local
  /^fe80:/i,                         // IPv6 link-local
  /^::ffff:127\./i,                  // IPv4-mapped loopback
  /^::ffff:10\./i,                   // IPv4-mapped private
  /^::ffff:172\.(1[6-9]|2\d|3[01])\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:169\.254\./i,            // IPv4-mapped metadata
];

export function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(ip));
}

/** Legacy alias */
export function isPrivateHostname(hostname: string): boolean {
  return isPrivateIp(hostname);
}

/**
 * Resolve a hostname to IPs and check if ANY of them are private.
 * This defends against DNS rebinding attacks where a public hostname
 * resolves to a private/internal IP address.
 *
 * Returns the resolved IPs on success, or an error message.
 */
export async function resolveAndValidateHost(
  hostname: string,
): Promise<{ error: string } | { ips: string[] }> {
  // First, check hostname directly (catches IP literals and "localhost")
  if (isPrivateIp(hostname)) {
    return { error: "Connections to private or local addresses are not allowed." };
  }

  // If hostname is already an IP literal, no DNS resolution needed
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":")) {
    return { ips: [hostname] };
  }

  // Resolve DNS and check every IP
  const resolvedIps: string[] = [];

  try {
    const ipv4s = await resolve4(hostname);
    resolvedIps.push(...ipv4s);
  } catch {
    // No A records — that's ok, might have AAAA only
  }

  try {
    const ipv6s = await resolve6(hostname);
    resolvedIps.push(...ipv6s);
  } catch {
    // No AAAA records
  }

  if (resolvedIps.length === 0) {
    return { error: "Could not resolve hostname. Check the URL and try again." };
  }

  const privateIp = resolvedIps.find((ip) => isPrivateIp(ip));
  if (privateIp) {
    return { error: "Connections to private or local addresses are not allowed." };
  }

  return { ips: resolvedIps };
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
 * Validate an MCP server URL with full DNS resolution check.
 * In production, resolves the hostname and blocks private IPs.
 * In development, only blocks obvious private hostnames (for local testing).
 */
export async function validateMcpUrl(
  url: string,
  blockPrivate: boolean,
): Promise<{ error: string } | { hostname: string }> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { error: "URL must start with http:// or https://" };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }

  if (blockPrivate) {
    const result = await resolveAndValidateHost(parsed.hostname);
    if ("error" in result) {
      return result;
    }
  }

  return { hostname: parsed.hostname };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
