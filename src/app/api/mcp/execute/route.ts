import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToServer } from "@/lib/mcp-client";
import { checkRateLimit, validateMcpUrl, getClientIp } from "@/lib/api-security";

const rateLimitMap = new Map<string, number[]>();
const EXECUTION_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 1_000_000;

const RequestSchema = z.object({
  url: z.string().url(),
  toolName: z.string().min(1, "toolName is required"),
  args: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (checkRateLimit(rateLimitMap, ip, 10, 60_000)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Wait a minute before trying again.", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body.", code: "INVALID_INPUT" },
      { status: 400 },
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request.", code: "INVALID_INPUT" },
      { status: 400 },
    );
  }

  const { url, toolName, args } = parsed.data;
  const isProduction = process.env.NODE_ENV === "production";
  const urlCheck = validateMcpUrl(url, isProduction ?? false);
  if ("error" in urlCheck) {
    return NextResponse.json(
      { success: false, error: urlCheck.error, code: "INVALID_INPUT" },
      { status: 400 },
    );
  }

  // Connect to server
  let connected: Awaited<ReturnType<typeof connectToServer>>;
  try {
    connected = await connectToServer(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "TIMEOUT") {
      return NextResponse.json(
        { success: false, error: "Server didn't respond within 10 seconds.", code: "TIMEOUT" },
        { status: 408 },
      );
    }
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "This server requires authentication. Check its docs for the required API key or token.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Couldn't reach this server. Check the URL.", code: "CONNECTION_FAILED" },
      { status: 502 },
    );
  }

  const { client } = connected;

  try {
    const startTime = Date.now();

    const result = await Promise.race([
      client.callTool({ name: toolName, arguments: args }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("EXECUTION_TIMEOUT")), EXECUTION_TIMEOUT_MS),
      ),
    ]);

    const executionTimeMs = Date.now() - startTime;

    // Check response size and truncate if needed
    const resultStr = JSON.stringify(result);
    let warning: string | undefined;
    let finalResult = result;

    if (resultStr.length > MAX_RESPONSE_BYTES) {
      warning = "Response was truncated at 1MB.";
      // Truncate text content to fit
      const truncated = { ...result } as typeof result;
      if (Array.isArray(truncated.content)) {
        truncated.content = truncated.content.map((block) => {
          if (block.type === "text") {
            const maxChars = 50_000;
            return {
              ...block,
              text: block.text.slice(0, maxChars) + (block.text.length > maxChars ? "\n\n[... truncated ...]" : ""),
            };
          }
          return block;
        });
      }
      finalResult = truncated;
    }

    return NextResponse.json({
      success: true,
      result: finalResult,
      executionTimeMs,
      ...(warning && { warning }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "EXECUTION_TIMEOUT") {
      return NextResponse.json(
        { success: false, error: "Tool execution timed out after 30 seconds.", code: "TIMEOUT" },
        { status: 408 },
      );
    }
    console.error("[mcp/execute] Error:", msg);
    return NextResponse.json(
      { success: false, error: "Tool execution failed. The server may have returned an error.", code: "EXECUTION_ERROR" },
      { status: 500 },
    );
  } finally {
    await client.close().catch(() => {});
  }
}
