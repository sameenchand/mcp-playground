"use client";

/**
 * React hook for running an MCP server inside a WebContainer.
 * Manages the full lifecycle: boot → install → spawn → MCP connect → inspect.
 * Client-side only.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { bootContainer, installPackage, spawnServer } from "./manager";
import { WebContainerTransport } from "./mcp-transport";
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

  const addLog = useCallback((line: string) => {
    setState((prev) => ({
      ...prev,
      installLog: [...prev.installLog.slice(-100), line],
    }));
  }, []);

  const connect = useCallback(async () => {
    setState({ status: "booting", installLog: [] });

    try {
      // Step 1: Boot WebContainer
      const container = await bootContainer();

      // Step 2: Install the package
      setState((prev) => ({ ...prev, status: "installing" }));
      await installPackage(container, packageName, version, addLog);

      // Step 3: Spawn the server process
      setState((prev) => ({ ...prev, status: "spawning" }));
      const process = await spawnServer(container, packageName, args, env);
      processRef.current = process;

      // Give the server a moment to start up
      await new Promise((r) => setTimeout(r, 1500));

      // Step 4: Connect MCP Client via custom transport
      setState((prev) => ({ ...prev, status: "connecting" }));
      const transport = new WebContainerTransport(process);
      transportRef.current = transport;

      const client = new Client({ name: "mcp-playground-sandbox", version: "1.0.0" });
      clientRef.current = client;

      await client.connect(transport);

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
        transport: "streamable-http", // Display as "stdio (in-browser)" in the UI
        connectionTimeMs: 0,
      };

      setInspectResult(result);
      setState((prev) => ({ ...prev, status: "ready" }));
    } catch (err) {
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
      // Cleanup on unmount
      clientRef.current?.close().catch(() => {});
      processRef.current?.kill();
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
    clientRef.current?.close().catch(() => {});
    processRef.current?.kill();
    clientRef.current = null;
    processRef.current = null;
    transportRef.current = null;
    setInspectResult(null);
    void connect();
  }, [connect]);

  const terminate = useCallback(() => {
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
