"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  Zap,
  Play,
  Lock,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { featuredServers, type FeaturedServer } from "@/lib/featured-servers";
import { InspectorResults } from "@/components/inspector/inspector-results";
import type { InspectResult } from "@/lib/mcp-client";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "idle" | "connecting" | "inspecting" | "done" | "error";

interface ConnectionState {
  status: Status;
  step?: string;
  error?: string;
  errorCode?: string;
  result?: InspectResult;
}

interface HeaderEntry {
  id: string;
  name: string;
  value: string;
}

const STATUS_STEPS = {
  connecting: "Connecting to server...",
  inspecting: "Inspecting tools, resources & prompts...",
};

const COMMON_HEADERS = ["Authorization", "X-API-Key", "X-Auth-Token", "Bearer"];

// ── sessionStorage helpers ─────────────────────────────────────────────────

function saveHeaders(url: string, headers: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`mcp_headers_${btoa(url)}`, JSON.stringify(headers));
  } catch {}
}

// ── Auth Headers Editor ────────────────────────────────────────────────────

function HeadersEditor({
  entries,
  onChange,
}: {
  entries: HeaderEntry[];
  onChange: (entries: HeaderEntry[]) => void;
}) {
  const addEntry = () => {
    onChange([...entries, { id: crypto.randomUUID(), name: "Authorization", value: "" }]);
  };

  const updateEntry = (id: string, field: "name" | "value", val: string) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
  };

  const removeEntry = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-2 pt-3 pb-1">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2">
          <input
            list="common-headers"
            value={entry.name}
            onChange={(e) => updateEntry(entry.id, "name", e.target.value)}
            placeholder="Header name"
            className="w-36 h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <datalist id="common-headers">
            {COMMON_HEADERS.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
          <input
            type="password"
            value={entry.value}
            onChange={(e) => updateEntry(entry.id, "value", e.target.value)}
            placeholder="Value"
            className="flex-1 h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
          />
          <button
            type="button"
            onClick={() => removeEntry(entry.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1"
      >
        <Plus className="h-3.5 w-3.5" />
        Add header
      </button>
      <p className="text-[10px] text-muted-foreground/50">
        Headers are stored in your browser session and only forwarded to the MCP server you connect to. We don&apos;t log or persist them.
      </p>
    </div>
  );
}

// ── Featured Server Card ───────────────────────────────────────────────────

function FeaturedServerCard({
  server,
  onSelect,
  isLoading,
}: {
  server: FeaturedServer;
  onSelect: (url: string) => void;
  isLoading: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(server.url)}
      disabled={isLoading}
      className="text-left rounded-lg border border-border/50 bg-card p-4 hover:border-primary/40 hover:bg-muted/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
            {server.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{server.description}</p>
          <p className="font-mono text-xs text-muted-foreground/60 mt-2 truncate">{server.url}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {server.requiresAuth && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                <Lock className="h-2.5 w-2.5" />
                requires auth
              </span>
            )}
            {server.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-xs bg-muted/50 text-muted-foreground border border-border/30"
              >
                {tag}
              </span>
            ))}
          </div>
          {server.authNote && (
            <p className="text-xs text-yellow-600/80 dark:text-yellow-400/70 mt-1.5 italic">
              {server.authNote}
            </p>
          )}
        </div>
        {server.source?.startsWith("http") && (
          <a
            href={server.source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </button>
  );
}

// ── Status Indicator ──────────────────────────────────────────────────────

function StatusIndicator({ status, step }: { status: Status; step?: string }) {
  if (status === "idle" || status === "done" || status === "error") return null;
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 border border-border/50">
      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">{step ?? STATUS_STEPS.connecting}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {(["connecting", "inspecting"] as const).map((s, i) => {
            const isActive = status === s;
            const isDone = s === "connecting" && status === "inspecting";
            return (
              <span
                key={s}
                className={`flex items-center gap-1 text-xs ${
                  isActive ? "text-primary" : isDone ? "text-green-400" : "text-muted-foreground/40"
                }`}
              >
                {i > 0 && <span className="text-muted-foreground/30">→</span>}
                {isDone ? "✓" : ""}
                {s === "connecting" ? "Connect" : "Inspect"}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ConnectClient({ initialUrl }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [state, setState] = useState<ConnectionState>({ status: "idle" });
  const [headerEntries, setHeaderEntries] = useState<HeaderEntry[]>([]);
  const [showHeaders, setShowHeaders] = useState(false);

  // Auto-open headers panel if URL already has saved headers
  useEffect(() => {
    if (!initialUrl || typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(`mcp_headers_${btoa(initialUrl)}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        const entries = Object.entries(parsed).map(([name, value]) => ({
          id: crypto.randomUUID(),
          name,
          value,
        }));
        if (entries.length > 0) {
          setHeaderEntries(entries);
          setShowHeaders(true);
        }
      }
    } catch {}
  }, [initialUrl]);

  const headersAsRecord = (): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const entry of headerEntries) {
      if (entry.name.trim() && entry.value.trim()) {
        result[entry.name.trim()] = entry.value.trim();
      }
    }
    return result;
  };

  const activeHeaderCount = headerEntries.filter(
    (e) => e.name.trim() && e.value.trim(),
  ).length;

  const inspect = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setUrl(targetUrl);
    setState({ status: "connecting", step: STATUS_STEPS.connecting });
    await new Promise((r) => setTimeout(r, 400));
    setState({ status: "inspecting", step: STATUS_STEPS.inspecting });

    const headers = headersAsRecord();

    try {
      const res = await fetch("/api/mcp/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, headers }),
      });

      const data = (await res.json()) as unknown;

      if (!res.ok) {
        const errorData = data as { error?: string; code?: string };
        // If auth error and no headers set, auto-open the headers panel
        if (errorData.code === "UNAUTHORIZED") {
          setShowHeaders(true);
        }
        setState({
          status: "error",
          error: errorData.error ?? "An unexpected error occurred.",
          errorCode: errorData.code,
        });
        return;
      }

      // Save headers to sessionStorage so the playground can pick them up
      if (Object.keys(headers).length > 0) {
        saveHeaders(targetUrl, headers);
      }

      setState({ status: "done", result: data as InspectResult });
    } catch {
      setState({ status: "error", error: "Network error — check your connection and try again." });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void inspect(url);
  };

  const isLoading = state.status === "connecting" || state.status === "inspecting";

  const FeaturedGrid = ({ title }: { title?: string }) => (
    <div>
      {title && <p className="text-sm text-muted-foreground mb-3">{title}</p>}
      {!title && (
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border/50" />
          <p className="text-sm text-muted-foreground">or try a featured server</p>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {featuredServers.map((server) => (
          <FeaturedServerCard
            key={server.id}
            server={server}
            onSelect={(u) => void inspect(u)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* URL + Auth form */}
      <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-mcp-server.com/mcp"
              disabled={isLoading}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Inspecting...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Inspect
              </>
            )}
          </button>
        </form>

        {/* Auth headers toggle */}
        <button
          type="button"
          onClick={() => setShowHeaders((v) => !v)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {activeHeaderCount > 0 ? (
            <span className="flex items-center gap-1.5">
              Auth headers
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-medium">
                <Check className="h-2.5 w-2.5" />
                {activeHeaderCount} set
              </span>
            </span>
          ) : (
            "Add auth headers"
          )}
          {showHeaders ? (
            <ChevronUp className="h-3 w-3 ml-auto" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-auto" />
          )}
        </button>

        {showHeaders && (
          <HeadersEditor entries={headerEntries} onChange={setHeaderEntries} />
        )}
      </div>

      {/* Status / Loading */}
      <StatusIndicator status={state.status} step={state.step} />

      {/* Error states */}
      {state.status === "error" && state.error && (
        state.errorCode === "UNAUTHORIZED" ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <KeyRound className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Authentication required
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{state.error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Add your API key in the{" "}
                <button
                  type="button"
                  onClick={() => setShowHeaders(true)}
                  className="text-primary hover:underline underline-offset-4"
                >
                  auth headers panel above
                </button>
                , then try again. Check the server&apos;s docs for the required key name and format.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Connection failed</p>
              <p className="text-sm text-muted-foreground mt-0.5">{state.error}</p>
            </div>
          </div>
        )
      )}

      {/* Results */}
      {state.status === "done" && state.result && (
        <div className="space-y-4">
          {state.result.capabilities.tools && state.result.tools.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {state.result.tools.length} tool
                  {state.result.tools.length !== 1 ? "s" : ""} available
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Test them live with real inputs and outputs
                </p>
              </div>
              <Link
                href={`/playground?url=${encodeURIComponent(url)}`}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
              >
                <Play className="h-3.5 w-3.5" />
                Open Playground
              </Link>
            </div>
          )}
          <InspectorResults
            result={state.result}
            onTryTool={(toolName) => {
              window.location.href = `/playground?url=${encodeURIComponent(url)}&tool=${encodeURIComponent(toolName)}`;
            }}
          />
        </div>
      )}

      {/* Featured Servers */}
      {state.status === "idle" && <FeaturedGrid />}
      {(state.status === "done" || state.status === "error") && (
        <FeaturedGrid title="Try another server:" />
      )}
    </div>
  );
}
