"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, AlertCircle, Share2, Check, ChevronDown, RotateCcw, Terminal } from "lucide-react";
import { useWebContainerMcp, type ExecuteResponse } from "@/lib/webcontainer/use-webcontainer-mcp";
import { WebContainerBootScreen } from "@/components/playground/webcontainer-boot-screen";
import { SchemaForm } from "@/components/playground/schema-form";
import { ResponseViewer, type ToolResult } from "@/components/playground/response-viewer";
import { HistoryPanel, type HistoryEntry } from "@/components/playground/history-panel";
import { ToolSidebar } from "@/components/playground/tool-sidebar";
import type { ToolSchema } from "@/lib/mcp-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WebContainerPlaygroundProps {
  packageName: string;
  version?: string;
  initialTool?: string;
}

const MAX_HISTORY = 50;

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <Check className="h-4 w-4 text-green-500" />
      {message}
    </div>
  );
}

// ── Mobile tool selector ──────────────────────────────────────────────────────

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

// ── Connection header for sandbox ─────────────────────────────────────────────

function SandboxConnectionHeader({
  packageName,
  version,
  toolCount,
  onRestart,
}: {
  packageName: string;
  version?: string;
  toolCount: number;
  onRestart: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/30 bg-muted/5">
      <div className="flex items-center gap-2">
        <Terminal className="h-4 w-4 text-purple-400" />
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          stdio (in-browser)
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono text-foreground truncate">
          {packageName}{version ? `@${version}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{toolCount} tool{toolCount !== 1 ? "s" : ""}</span>
        <button
          onClick={onRestart}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition-colors"
          title="Restart server"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WebContainerPlayground({
  packageName,
  version,
  initialTool,
}: WebContainerPlaygroundProps) {
  const router = useRouter();
  const submitFnRef = useRef<(() => void) | null>(null);

  const { state, inspectResult, executeTool, restart, terminate } =
    useWebContainerMcp(packageName, version);

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedToolName, setSelectedToolName] = useState<string | null>(initialTool ?? null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [formKey, setFormKey] = useState(0);

  const [executeStatus, setExecuteStatus] = useState<"idle" | "running">("idle");
  const [lastResult, setLastResult] = useState<ToolResult | null>(null);
  const [lastExecTime, setLastExecTime] = useState<number | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [lastWarning, setLastWarning] = useState<string | undefined>(undefined);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | undefined>(undefined);

  const [toast, setToast] = useState<string | null>(null);

  // Auto-select first tool or initialTool when inspect result arrives
  useEffect(() => {
    if (inspectResult && !selectedToolName) {
      const toolToSelect = initialTool ?? inspectResult.tools[0]?.name ?? null;
      if (toolToSelect) setSelectedToolName(toolToSelect);
    }
  }, [inspectResult, selectedToolName, initialTool]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const tools = inspectResult?.tools ?? [];
  const selectedTool: ToolSchema | null =
    tools.find((t) => t.name === selectedToolName) ?? null;

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

      const params = new URLSearchParams({ package: packageName, tool: name });
      if (version) params.set("version", version);
      router.replace(`/playground/sandbox?${params.toString()}`, { scroll: false });
    },
    [packageName, version, router],
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

      const data: ExecuteResponse = await executeTool(selectedToolName, args);
      const execTime = data.executionTimeMs ?? 0;

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        toolName: selectedToolName,
        args,
        result: data.success && data.result
          ? { content: data.result.content as ToolResult["content"], isError: data.result.isError }
          : null,
        error: data.success ? null : (data.error ?? "Unknown error"),
        executionTimeMs: execTime,
        warning: data.warning,
      };

      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
      setActiveHistoryId(entry.id);

      if (data.success && data.result) {
        setLastResult({
          content: data.result.content as ToolResult["content"],
          isError: data.result.isError,
        });
        setLastExecTime(execTime);
        setLastWarning(data.warning);
      } else {
        setExecuteError(data.error ?? "Execution failed.");
      }

      setExecuteStatus("idle");
    },
    [selectedToolName, executeStatus, executeTool],
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
    const params = new URLSearchParams({ package: packageName });
    if (version) params.set("version", version);
    if (selectedToolName) {
      params.set("tool", selectedToolName);
      if (Object.keys(formValues).length > 0) {
        params.set("args", btoa(JSON.stringify(formValues)));
      }
    }
    const shareUrl = `${window.location.origin}/playground/sandbox?${params.toString()}`;
    void navigator.clipboard.writeText(shareUrl);
    setToast("Link copied!");
    setTimeout(() => setToast(null), 2000);
  }, [packageName, version, selectedToolName, formValues]);

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

  // ── Boot/install/connect screen ────────────────────────────────────────────
  if (state.status !== "ready") {
    return (
      <WebContainerBootScreen
        status={state.status}
        error={state.error}
        installLog={state.installLog}
        packageName={packageName}
        onRetry={restart}
      />
    );
  }

  // ── Empty tool list ────────────────────────────────────────────────────────
  if (tools.length === 0) {
    return (
      <>
        <SandboxConnectionHeader
          packageName={packageName}
          version={version}
          toolCount={0}
          onRestart={restart}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <p className="text-lg font-medium text-foreground">No tools available</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            This package doesn&apos;t expose any tools. It may only support resources or prompts.
          </p>
        </div>
      </>
    );
  }

  const isRunning = executeStatus === "running";

  // ── Main 3-panel layout ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <SandboxConnectionHeader
        packageName={packageName}
        version={version}
        toolCount={tools.length}
        onRestart={restart}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-border/30 bg-background">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted/50"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      </div>

      {/* Mobile tool selector */}
      <div className="lg:hidden px-4 py-3 border-b border-border/30">
        <MobileToolSelect tools={tools} selectedTool={selectedToolName} onSelect={handleSelectTool} />
      </div>

      {/* 3-panel grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[220px_1fr_420px] min-h-0 overflow-hidden">
        {/* Left: tool list + history */}
        <aside className="hidden lg:flex flex-col border-r border-border/30 bg-muted/5 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3">
            <ToolSidebar
              tools={tools}
              resources={[]}
              prompts={[]}
              activeTab="tools"
              onTabChange={() => {}}
              selectedItem={selectedToolName}
              onSelect={handleSelectTool}
            />
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

        {/* Center: form */}
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

        {/* Right: response */}
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
    </div>
  );
}
