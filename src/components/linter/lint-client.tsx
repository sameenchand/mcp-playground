"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { LintReportView } from "@/components/linter/lint-report";
import type { LintReport } from "@/lib/schema-linter";
import type { InspectResult } from "@/lib/mcp-client";

type Status = "idle" | "linting" | "done" | "error";

interface LintState {
  status: Status;
  error?: string;
  errorCode?: string;
  inspect?: InspectResult;
  lint?: LintReport;
}

const EXAMPLE_SERVERS = [
  { name: "DeepWiki", url: "https://mcp.deepwiki.com/mcp" },
  { name: "Browserbase", url: "https://api.browserbase.com/mcp" },
];

export function LintClient() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(() => searchParams.get("url") ?? "");
  const [state, setState] = useState<LintState>({ status: "idle" });
  const autoRanRef = useRef(false);

  const isLoading = state.status === "linting";

  const lint = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setUrl(targetUrl);
    setState({ status: "linting" });

    try {
      const res = await fetch("/api/mcp/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = (await res.json()) as unknown;

      if (!res.ok) {
        const err = data as { error?: string; code?: string };
        setState({
          status: "error",
          error: err.error ?? "An unexpected error occurred.",
          errorCode: err.code,
        });
        return;
      }

      const result = data as { inspect: InspectResult; lint: LintReport };
      setState({
        status: "done",
        inspect: result.inspect,
        lint: result.lint,
      });
    } catch {
      setState({
        status: "error",
        error: "Network error — check your connection and try again.",
      });
    }
  };

  // Auto-trigger lint when ?url= is present in query params
  useEffect(() => {
    const paramUrl = searchParams.get("url");
    if (paramUrl && !autoRanRef.current) {
      autoRanRef.current = true;
      void lint(paramUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void lint(url);
  };

  return (
    <div className="space-y-6">
      {/* URL form */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
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
                Linting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Lint Server
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading */}
      {state.status === "linting" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 border border-border/50">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Connecting and analyzing server...
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This usually takes 2-5 seconds
            </p>
          </div>
        </div>
      )}

      {/* Error */}
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
                The linter currently doesn&apos;t support authenticated servers.
                Use the{" "}
                <a href="/connect" className="text-primary hover:underline underline-offset-4">
                  Connect page
                </a>{" "}
                to inspect servers that require auth.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Lint failed</p>
              <p className="text-sm text-muted-foreground mt-0.5">{state.error}</p>
            </div>
          </div>
        )
      )}

      {/* Results */}
      {state.status === "done" && state.lint && state.inspect && (
        <LintReportView report={state.lint} inspect={state.inspect} />
      )}

      {/* Example servers (idle or after results) */}
      {(state.status === "idle" || state.status === "done" || state.status === "error") && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-border/50" />
            <p className="text-sm text-muted-foreground">
              {state.status === "idle" ? "try an example" : "lint another server"}
            </p>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_SERVERS.map((server) => (
              <button
                key={server.url}
                onClick={() => void lint(server.url)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground hover:border-primary/40 hover:bg-muted/20 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                {server.name}
                <span className="font-mono text-xs text-muted-foreground/60 truncate max-w-48">
                  {server.url}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
