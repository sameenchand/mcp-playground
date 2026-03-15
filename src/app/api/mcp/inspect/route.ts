import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inspectMcpServer } from "@/lib/mcp-client";

// In-memory rate limiter: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

// Block private/internal IP ranges and localhost
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

function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

const RequestSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine(
      (val) => val.startsWith("http://") || val.startsWith("https://"),
      "URL must start with http:// or https://",
    ),
  headers: z.record(z.string(), z.string()).optional().default({}),
});

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute before trying again." },
      { status: 429 },
    );
  }

  // Parse and validate body
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

  // Block private IPs/localhost
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }

  if (isPrivateHostname(parsedUrl.hostname) && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Connections to private or local addresses are not allowed." },
      { status: 400 },
    );
  }

  // Connect and inspect
  try {
    const result = await inspectMcpServer(url, { headers });
    return NextResponse.json(result);
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
        {
          error:
            "This server requires authentication. Check its documentation for the required API key or token.",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (message === "CONNECTION_FAILED") {
      return NextResponse.json(
        { error: "Couldn't reach this server. Check the URL and make sure it's running." },
        { status: 502 },
      );
    }

    console.error("[mcp/inspect] Unexpected error:", message);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
