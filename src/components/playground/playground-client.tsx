"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, AlertCircle, ChevronDown, Share2, Check, RotateCcw, Code2 } from "lucide-react";
import { SchemaForm } from "@/components/playground/schema-form";
import { ResponseViewer, type ToolResult } from "@/components/playground/response-viewer";
import { HistoryPanel, type HistoryEntry } from "@/components/playground/history-panel";
import { ToolSidebar } from "@/components/playground/tool-sidebar";
import { ConnectionHeader } from "@/components/playground/connection-header";
import { AddToIdeModal } from "@/components/playground/add-to-ide-modal";
import { saveRecentServer } from "@/components/playground/playground-landing";
import type { InspectResult, ToolSchema } from "@/lib/mcp-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExecuteResponse {
  success: boolean;
  result?: ToolResult;
  executionTimeMs?: number;
  error?: string;
  warning?: string;
}

interface PlaygroundClientProps {
  serverUrl: string;
  initialTool?: string;
  initialArgs?: Record<string, unknown>;
  autoRun?: boolean;
  embedded?: boolean;
}

const MAX_HISTORY = 50;

// ── Actionable error messages ─────────────────────────────────────────────────

function toActionableError(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes("connection_failed") || r.includes("econnrefused") || r.includes("connection refused")) {
    return "Could not connect to the server. Check the URL and make sure it is running and publicly accessible.";
  }
  if (r.includes("timeout") || r.includes("timed out")) {
    return "The server took too long to respond. It may be overloaded or the tool is slow to execute.";
  }
  if (r.includes("unauthorized") || r.includes("401") || r.includes("403") || r.includes("forbidden")) {
    return "Authentication required. Add your API key or auth headers via the Connect page.";
  }
  if (r.includes("rate_limited") || r.includes("429") || r.includes("too many requests")) {
    return "Rate limit reached. Please wait a moment before running again.";
  }
  if (r.includes("not found") || r.includes("404")) {
    return "Server endpoint not found. Double-check the URL path.";
  }
  if (r.includes("network error") || r.includes("failed to fetch")) {
    return "Network error — check your internet connection and try again.";
  }
  return raw;
}

// ── localStorage history helpers ──────────────────────────────────────────────

function historyKey(url: string): string {
  try {
    return `mcp_hist_${btoa(url)}`;
  } catch {
    return "mcp_hist_default";
  }
}

function loadHistory(url: string): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(historyKey(url));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed.map((e) => ({
      ...e,
      timestamp: new Date(e.timestamp as string),
    })) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(url: string, entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(historyKey(url), JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // Ignore storage errors (quota exceeded, private mode, etc.)
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <Check className="h-4 w-4 text-green-500" />
      {message}
    </div>
  );
}

// ── Tool selector (mobile dropdown) ──────────────────────────────────────────

function MobileToolSelect({
  tools,
  selectedTool,
  onSelect,
}: {
  tools: ToolSchema[];
  selectedTool: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={selectedTool ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full h-9 pl-3 pr-8 rounded-md border border-border bg-background text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="" disabled>
          Select a tool…
        </option>
        {tools.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlaygroundClient({ serverUrl, initialTool, initialArgs, autoRun, embedded = false }: PlaygroundClientProps) {
  const router = useRouter();
  const submitFnRef = useRef<(() => void) | null>(null);
  const hasAutoRun = useRef(false);

  // ── State ──────────────────────────────────────────────────────────────────
  const [inspectStatus, setInspectStatus] = useState<"loading" | "ready" | "error">("loading");
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);

  const [selectedToolName, setSelectedToolName] = useState<string | null>(initialTool ?? null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>(initialArgs ?? {});
  const [formKey, setFormKey] = useState(0); // force form re-mount on tool change

  const [executeStatus, setExecuteStatus] = useState<"idle" | "running">("idle");
  const [lastResult, setLastResult] = useState<ToolResult | null>(null);
  const [lastExecTime, setLastExecTime] = useState<number | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [lastWarning, setLastWarning] = useState<string | undefined>(undefined);

  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory(serverUrl));
  const [activeHistoryId, setActiveHistoryId] = useState<string | undefined>(undefined);

  const [toast, setToast] = useState<string | null>(null);
  const [addToIdeOpen, setAddToIdeOpen] = useState(false);

  // Read auth headers saved by ConnectClient into sessionStorage
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(`mcp_headers_${btoa(serverUrl)}`);
      if (stored) setAuthHeaders(JSON.parse(stored) as Record<string, string>);
    } catch {}
  }, [serverUrl]);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    saveHistory(serverUrl, history);
  }, [history, serverUrl]);

  // ── Inspect logic (reusable for retry) ────────────────────────────────────
  const doInspect = useCallback(async () => {
    setInspectStatus("loading");
    setInspectError(null);
    try {
      const res = await fetch("/api/mcp/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: serverUrl, headers: authHeaders }),
      });
      const data = await res.json() as unknown;
      if (!res.ok) {
        const err = data as { error?: string };
        setInspectError(toActionableError(err.error ?? "Failed to connect to server."));
        setInspectStatus("error");
        return;
      }
      const result = data as InspectResult;
      setInspectResult(result);
      setInspectStatus("ready");

      // Save to recent servers
      saveRecentServer(
        serverUrl,
        result.serverInfo?.name ?? new URL(serverUrl).hostname,
        result.tools.length,
      );

      // Pre-select tool from URL param or first tool
      const toolToSelect = initialTool ?? result.tools[0]?.name ?? null;
      if (toolToSelect) setSelectedToolName(toolToSelect);
    } catch {
      setInspectError("Network error — check your connection.");
      setInspectStatus("error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, authHeaders]);

  // Auto-inspect on mount
  useEffect(() => {
    void doInspect();
  }, [doInspect]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedTool: ToolSchema | null =
    inspectResult?.tools.find((t) => t.name === selectedToolName) ?? null;

  // ── Tool selection ─────────────────────────────────────────────────────────
  const handleSelectTool = useCallback(
    (name: string) => {
      setSelectedToolName(name);
      setFormValues({});
      setFormKey((k) => k + 1);
      setLastResult(null);
      setLastExecTime(null);
      setExecuteError(null);
      setLastWarning(undefined);
      setActiveHistoryId(undefined);

      // Update URL
      const params = new URLSearchParams({ url: serverUrl, tool: name });
      router.replace(`/playground?${params.toString()}`, { scroll: false });
    },
    [serverUrl, router],
  );

  // ── Execute tool ──────────────────────────────────────────────────────────
  const handleRun = useCallback(
    async (args: Record<string, unknown>) => {
      if (!selectedToolName || executeStatus === "running") return;
      setFormValues(args);
      setExecuteStatus("running");
      setExecuteError(null);
      setLastResult(null);
      setLastExecTime(null);
      setLastWarning(undefined);

      const startTime = Date.now();
      try {
        const res = await fetch("/api/mcp/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: serverUrl, toolName: selectedToolName, args, headers: authHeaders }),
        });
        const data = (await res.json()) as ExecuteResponse;
        const execTime = data.executionTimeMs ?? Date.now() - startTime;

        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          toolName: selectedToolName,
          args,
          result: data.success ? (data.result ?? null) : null,
          error: data.success ? null : (data.error ?? "Unknown error"),
          executionTimeMs: execTime,
          warning: data.warning,
        };

        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
        setActiveHistoryId(entry.id);

        if (data.success && data.result) {
          setLastResult(data.result);
          setLastExecTime(execTime);
          setLastWarning(data.warning);
        } else {
          setExecuteError(toActionableError(data.error ?? "Execution failed."));
        }
      } catch {
        const execTime = Date.now() - startTime;
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          toolName: selectedToolName,
          args,
          result: null,
          error: "Network error",
          executionTimeMs: execTime,
        };
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
        setExecuteError("Network error — check your internet connection and try again.");
      } finally {
        setExecuteStatus("idle");
      }
    },
    [selectedToolName, serverUrl, executeStatus],
  );

  // ── Replay from history ────────────────────────────────────────────────────
  const handleReplay = useCallback(
    (entry: HistoryEntry) => {
      if (entry.toolName !== selectedToolName) {
        handleSelectTool(entry.toolName);
      }
      setFormValues(entry.args);
      setFormKey((k) => k + 1);
      setLastResult(entry.result);
      setLastExecTime(entry.executionTimeMs);
      setExecuteError(entry.error);
      setLastWarning(entry.warning);
      setActiveHistoryId(entry.id);
    },
    [selectedToolName, handleSelectTool],
  );

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const params = new URLSearchParams({ url: serverUrl });
    if (selectedToolName) {
      params.set("tool", selectedToolName);
      if (Object.keys(formValues).length > 0) {
        const encoded = btoa(JSON.stringify(formValues));
        params.set("args", encoded);
        // If there's a successful result, the shared link will auto-execute
        if (lastResult) params.set("autorun", "1");
      }
    }
    const shareUrl = `${window.location.origin}/playground?${params.toString()}`;
    void navigator.clipboard.writeText(shareUrl);
    setToast(lastResult ? "Execution link copied!" : "Link copied!");
    setTimeout(() => setToast(null), 2500);
  }, [serverUrl, selectedToolName, formValues, lastResult]);

  // ── Keyboard shortcut: Cmd/Ctrl + Enter ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitFnRef.current?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Auto-run from shared link (?autorun=1) ─────────────────────────────────
  useEffect(() => {
    if (!autoRun || hasAutoRun.current) return;
    if (inspectStatus !== "ready") return;
    if (!selectedToolName) return;
    if (!initialArgs || Object.keys(initialArgs).length === 0) return;
    hasAutoRun.current = true;
    const timer = setTimeout(() => {
      void handleRun(initialArgs);
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, inspectStatus, selectedToolName]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (inspectStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium text-foreground">Connecting to server…</p>
          <p className="text-sm mt-1">{serverUrl}</p>
        </div>
      </div>
    );
  }

  if (inspectStatus === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium text-foreground">Failed to connect</p>
          <p className="text-sm text-muted-foreground mt-1">{inspectError}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void doInspect()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
          <a
            href="/connect"
            className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Back to Connect
          </a>
        </div>
      </div>
    );
  }

  const tools = inspectResult?.tools ?? [];
  const isRunning = executeStatus === "running";

  // ── Empty tool list ────────────────────────────────────────────────────────
  if (tools.length === 0) {
    return (
      <>
        {inspectResult && !embedded && (
          <ConnectionHeader serverUrl={serverUrl} inspectResult={inspectResult} />
        )}
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <p className="text-lg font-medium text-foreground">No tools available</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            This server doesn&apos;t expose any tools. Check the Resources and Prompts tabs on the
            inspector.
          </p>
          <a
            href={`/connect?url=${encodeURIComponent(serverUrl)}`}
            className="text-sm text-primary hover:underline"
          >
            View in Inspector →
          </a>
        </div>
      </>
    );
  }

  // ── Main 3-panel layout ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Connection header — hidden in embedded mode */}
      {!embedded && (
        <ConnectionHeader serverUrl={serverUrl} inspectResult={inspectResult} />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/30 bg-background">
        <button
          onClick={() => setAddToIdeOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted/50"
        >
          <Code2 className="h-3.5 w-3.5" />
          Add to IDE
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted/50"
        >
          <Share2 className="h-3.5 w-3.5" />
          {lastResult ? "Share run" : "Share"}
        </button>
      </div>

      {/* Mobile tool selector */}
      <div className="lg:hidden px-4 py-3 border-b border-border/30">
        <MobileToolSelect tools={tools} selectedTool={selectedToolName} onSelect={handleSelectTool} />
      </div>

      {/* 3-panel grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[220px_1fr_420px] min-h-0 overflow-hidden">
        {/* ── Left: tool list + history ── */}
        <aside className="hidden lg:flex flex-col border-r border-border/30 bg-muted/5 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3">
            <ToolSidebar tools={tools} selectedTool={selectedToolName} onSelect={handleSelectTool} />
          </div>

          {history.length > 0 && (
            <div className="border-t border-border/30 p-3 max-h-64 overflow-y-auto">
              <HistoryPanel
                entries={history}
                onReplay={handleReplay}
                onClear={() => setHistory([])}
                activeId={activeHistoryId}
              />
            </div>
          )}
        </aside>

        {/* ── Center: form ── */}
        <main className="overflow-y-auto p-5 space-y-4">
          {!selectedTool ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-muted-foreground">
              <p className="text-sm">Select a tool from the sidebar to get started</p>
            </div>
          ) : (
            <>
              {/* Tool header */}
              <div className="pb-3 border-b border-border/30">
                <h2 className="font-mono text-base font-semibold text-foreground">
                  {selectedTool.name}
                </h2>
                {selectedTool.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedTool.description}</p>
                )}
              </div>

              {/* Form */}
              <SchemaForm
                key={formKey}
                schema={selectedTool.inputSchema}
                onSubmit={(vals) => void handleRun(vals)}
                isLoading={isRunning}
                initialValues={Object.keys(formValues).length > 0 ? formValues : undefined}
                onRegisterSubmit={(fn) => { submitFnRef.current = fn; }}
              />

              {/* Run button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => submitFnRef.current?.()}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run {selectedTool.name}
                      <span className="ml-auto text-xs opacity-50">⌘↵</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mobile history */}
              {history.length > 0 && (
                <div className="lg:hidden border-t border-border/30 pt-4">
                  <HistoryPanel
                    entries={history}
                    onReplay={handleReplay}
                    onClear={() => setHistory([])}
                    activeId={activeHistoryId}
                  />
                </div>
              )}
            </>
          )}
        </main>

        {/* ── Right: response ── */}
        <aside className="border-l border-border/30 overflow-y-auto p-5">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Response
          </h3>

          {executeError && !isRunning && (
            <div className="p-3 rounded-md bg-red-500/5 border border-red-500/20 mb-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{executeError}</p>
              </div>
              <button
                onClick={() => submitFnRef.current?.()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}

          <ResponseViewer
            result={lastResult}
            executionTimeMs={lastExecTime}
            isLoading={isRunning}
            warning={lastWarning}
          />
        </aside>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} />}

      {/* Add to IDE modal */}
      <AddToIdeModal
        open={addToIdeOpen}
        onClose={() => setAddToIdeOpen(false)}
        serverUrl={serverUrl}
        serverName={inspectResult?.serverInfo.name ?? new URL(serverUrl).hostname}
        transport={inspectResult?.transport}
      />
    </div>
  );
}
