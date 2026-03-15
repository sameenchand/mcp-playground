"use client";

/**
 * React hook for running an MCP server inside a WebContainer.
 * Manages the full lifecycle: boot → install → spawn → MCP connect → inspect.
 * Client-side only.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { bootContainer, installPackage, spawnServer } from "./manager";
import { WebContainerTransport, createSharedReader } from "./mcp-transport";
import type { InspectResult, ToolSchema, ResourceInfo, PromptInfo } from "@/lib/mcp-client";
import type { WebContainerProcess } from "@webcontainer/api";

export type SandboxStatus =
  | "idle"
  | "booting"
  | "installing"
  | "spawning"
  | "connecting"
  | "ready"
  | "error";

export interface SandboxState {
  status: SandboxStatus;
  error?: string;
  installLog: string[];
}

export interface ExecuteResponse {
  success: boolean;
  result?: {
    content: Array<{ type: string; text?: string; data?: string; mimeType?: string; resource?: Record<string, unknown> }>;
    isError?: boolean;
  };
  executionTimeMs?: number;
  error?: string;
  warning?: string;
}

export interface UseWebContainerMcpReturn {
  state: SandboxState;
  inspectResult: InspectResult | null;
  executeTool: (toolName: string, args: Record<string, unknown>) => Promise<ExecuteResponse>;
  restart: () => void;
  terminate: () => void;
}

/**
 * Try connecting the MCP client. If it fails with "Method not found" (-32601),
 * retry up to `maxAttempts` times with increasing delays.
 * This handles servers that need extra startup time.
 */
async function connectWithRetry(
  process: WebContainerProcess,
  packageName: string,
  maxAttempts = 3,
): Promise<{ client: Client; transport: WebContainerTransport }> {
  let lastError: Error | null = null;

  // Create a single shared reader for process.output — ReadableStreams can only
  // have one active reader, and data consumed by one reader is gone forever.
  // All retry attempts must share the same reader to avoid losing messages.
  const sharedReader = createSharedReader(process);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const transport = new WebContainerTransport(process, sharedReader);
    const client = new Client({ name: "mcp-playground-sandbox", version: "1.0.0" });

    try {
      await client.connect(transport);
      return { client, transport };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Clean up this attempt (SDK already calls transport.close() on failure,
      // but close() no longer kills the process, so this is just belt-and-suspenders)
      try { await transport.close(); } catch { /* ignore */ }

      // Retry all errors — the process is still alive (close() no longer kills it),
      // and most failures are timing-related (server not ready yet).
      if (attempt < maxAttempts - 1) {
        // Wait with increasing backoff: 2s, 4s
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError ?? new Error("Failed to connect after retries");
}

export function useWebContainerMcp(
  packageName: string,
  version?: string,
  args?: string[],
  env?: Record<string, string>,
): UseWebContainerMcpReturn {
  const [state, setState] = useState<SandboxState>({
    status: "idle",
    installLog: [],
  });
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);

  const clientRef = useRef<Client | null>(null);
  const processRef = useRef<WebContainerProcess | null>(null);
  const transportRef = useRef<WebContainerTransport | null>(null);
  // Version counter to handle React Strict Mode double-mount.
  // Each connect() captures its own ID. Cleanup increments the counter,
  // so stale connect() calls always see a mismatch and bail out.
  const connectIdRef = useRef(0);
  // Tracks whether we intentionally killed the process (cleanup/restart/terminate).
  // Prevents noisy "exited with code 143" console errors on navigation.
  const intentionalKillRef = useRef(false);

  const addLog = useCallback((line: string) => {
    setState((prev) => ({
      ...prev,
      installLog: [...prev.installLog.slice(-100), line],
    }));
  }, []);

  const connect = useCallback(async () => {
    const myId = ++connectIdRef.current;
    setState({ status: "booting", installLog: [] });

    try {
      // Guard: WebContainers requires cross-origin isolation
      if (typeof window !== "undefined" && !window.crossOriginIsolated) {
        throw new Error(
          "Cross-origin isolation is required for the in-browser sandbox. " +
          "Please open this URL directly in a new tab (not via in-app navigation). " +
          "The required headers are only applied on a full page load.",
        );
      }

      const bootTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(
          "WebContainer boot timed out after 30 seconds. " +
          "Try refreshing the page or using Chrome/Edge."
        )), 30_000),
      );

      // Step 1: Boot WebContainer
      const container = await Promise.race([bootContainer(), bootTimeout]);
      if (connectIdRef.current !== myId) return;

      // Step 2: Install the package
      setState((prev) => ({ ...prev, status: "installing" }));
      await installPackage(container, packageName, version, addLog);
      if (connectIdRef.current !== myId) return;

      // Step 3: Spawn the server process
      setState((prev) => ({ ...prev, status: "spawning" }));
      const process = await spawnServer(container, packageName, args, env);
      if (connectIdRef.current !== myId) { process.kill(); return; }
      processRef.current = process;

      // Monitor for unexpected exit
      let processExited = false;
      intentionalKillRef.current = false;
      process.exit.then((code) => {
        processExited = true;
        if (code !== 0 && !intentionalKillRef.current) {
          console.error(`[sandbox] Server process exited unexpectedly with code ${code}`);
        }
      });

      // Give the server time to start up.
      // MCP stdio servers need to initialize their JSON-RPC handler before
      // they can accept messages. 3 seconds is enough for most packages.
      await new Promise((r) => setTimeout(r, 3000));
      if (connectIdRef.current !== myId) return; // Strict Mode killed the process; let re-mount handle it

      if (processExited) {
        throw new Error(
          `Server process exited before we could connect. ` +
          `The package "${packageName}" may not be a valid MCP stdio server.`,
        );
      }

      // Step 4: Connect MCP Client with retry
      setState((prev) => ({ ...prev, status: "connecting" }));
      const { client, transport } = await connectWithRetry(process, packageName, 3);
      if (connectIdRef.current !== myId) { await transport.close(); return; }
      clientRef.current = client;
      transportRef.current = transport;

      // Step 5: Inspect — list tools, resources, prompts
      const serverVersion = client.getServerVersion();
      const serverCaps = client.getServerCapabilities();

      const hasTools = !!serverCaps?.tools;
      const hasResources = !!serverCaps?.resources;
      const hasPrompts = !!serverCaps?.prompts;

      const [toolsResult, resourcesResult, promptsResult] = await Promise.all([
        hasTools ? client.listTools() : Promise.resolve({ tools: [] }),
        hasResources ? client.listResources() : Promise.resolve({ resources: [] }),
        hasPrompts ? client.listPrompts() : Promise.resolve({ prompts: [] }),
      ]);

      const result: InspectResult = {
        serverInfo: {
          name: serverVersion?.name ?? packageName,
          version: serverVersion?.version ?? "unknown",
        },
        capabilities: { tools: hasTools, resources: hasResources, prompts: hasPrompts },
        tools: toolsResult.tools.map((t): ToolSchema => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema as Record<string, unknown>,
        })),
        resources: resourcesResult.resources.map((r): ResourceInfo => ({
          uri: r.uri,
          name: r.name,
          description: r.description,
          mimeType: r.mimeType,
        })),
        prompts: promptsResult.prompts.map((p): PromptInfo => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments,
        })),
        transport: "stdio",
        connectionTimeMs: 0,
      };

      setInspectResult(result);
      setState((prev) => ({ ...prev, status: "ready" }));
    } catch (err) {
      // Only update state if this connect() is still the active one
      if (connectIdRef.current !== myId) return;
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: message,
      }));
    }
  }, [packageName, version, args, env, addLog]);

  // Auto-connect on mount
  useEffect(() => {
    void connect();
    return () => {
      // Increment the counter to invalidate any running connect() call.
      // The next mount's connect() will get a new ID, and the stale one
      // will see a mismatch at the next checkpoint and bail out.
      connectIdRef.current++;
      intentionalKillRef.current = true;
      clientRef.current?.close().catch(() => {});
      processRef.current?.kill();
      clientRef.current = null;
      processRef.current = null;
      transportRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeTool = useCallback(
    async (toolName: string, toolArgs: Record<string, unknown>): Promise<ExecuteResponse> => {
      const client = clientRef.current;
      if (!client) {
        return { success: false, error: "Not connected to MCP server" };
      }

      const startTime = Date.now();
      try {
        const result = await client.callTool({ name: toolName, arguments: toolArgs });
        const executionTimeMs = Date.now() - startTime;

        return {
          success: true,
          result: {
            content: (result.content as Array<Record<string, unknown>>).map((block) => ({
              type: (block.type as string) ?? "text",
              text: block.text as string | undefined,
              data: block.data as string | undefined,
              mimeType: block.mimeType as string | undefined,
              resource: block.resource as Record<string, unknown> | undefined,
            })),
            isError: result.isError as boolean | undefined,
          },
          executionTimeMs,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          executionTimeMs: Date.now() - startTime,
        };
      }
    },
    [],
  );

  const restart = useCallback(() => {
    intentionalKillRef.current = true;
    clientRef.current?.close().catch(() => {});
    processRef.current?.kill();
    clientRef.current = null;
    processRef.current = null;
    transportRef.current = null;
    setInspectResult(null);
    void connect();
  }, [connect]);

  const terminate = useCallback(() => {
    intentionalKillRef.current = true;
    clientRef.current?.close().catch(() => {});
    processRef.current?.kill();
    clientRef.current = null;
    processRef.current = null;
    transportRef.current = null;
    setState({ status: "idle", installLog: [] });
    setInspectResult(null);
  }, []);

  return { state, inspectResult, executeTool, restart, terminate };
}
