import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inspectMcpServer } from "@/lib/mcp-client";
import { checkRateLimit, validateMcpUrl, getClientIp } from "@/lib/api-security";

const rateLimitMap = new Map<string, number[]>();

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
  const ip = getClientIp(req);

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

  const { url, headers } = parsed.data;

  // Validate URL + DNS resolution (blocks SSRF, cloud metadata, DNS rebinding)
  const isProduction = process.env.NODE_ENV === "production";
  const urlCheck = await validateMcpUrl(url, isProduction);
  if ("error" in urlCheck) {
    return NextResponse.json({ error: urlCheck.error }, { status: 400 });
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
