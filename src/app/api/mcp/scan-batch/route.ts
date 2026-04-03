import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scanServerBatch } from "@/lib/quality-scanner";
import { checkRateLimit, validateMcpUrl, getClientIp } from "@/lib/api-security";

export const maxDuration = 30;

const rateLimitMap = new Map<string, number[]>();

const RequestSchema = z.object({
  urls: z
    .array(
      z
        .string()
        .url("Each entry must be a valid URL")
        .refine(
          (val) =>
            val.startsWith("http://") ||
            val.startsWith("https://") ||
            val.startsWith("ws://") ||
            val.startsWith("wss://"),
          "URL must start with http://, https://, ws://, or wss://",
        ),
    )
    .min(1, "At least one URL is required")
    .max(3, "Maximum 3 URLs per batch"),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Higher rate limit for batch scanning (20 requests/min)
  if (checkRateLimit(rateLimitMap, ip, 20, 60_000)) {
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

  const { urls } = parsed.data;

  // Validate each URL (blocks SSRF, private IPs, DNS rebinding)
  const isProduction = process.env.NODE_ENV === "production";
  for (const url of urls) {
    const urlCheck = await validateMcpUrl(url, isProduction);
    if ("error" in urlCheck) {
      return NextResponse.json(
        { error: `Invalid URL "${url}": ${urlCheck.error}` },
        { status: 400 },
      );
    }
  }

  try {
    const results = await scanServerBatch(urls);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[mcp/scan-batch] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during scanning." },
      { status: 500 },
    );
  }
}
