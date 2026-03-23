"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, WifiOff, Lock, RefreshCw } from "lucide-react";
import { lintMcpServer } from "@/lib/schema-linter";
import { LintReportView } from "@/components/linter/lint-report";
import type { InspectResult } from "@/lib/mcp-client";
import type { LintReport } from "@/lib/schema-linter";

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "done"; report: LintReport; inspect: InspectResult }
  | { status: "error"; message: string };

export function ServerQualityPanel({ url }: { url: string }) {
  const [state, setState] = useState<ScanState>({ status: "idle" });

  const runScan = async () => {
    setState({ status: "scanning" });
    try {
      const res = await fetch("/api/mcp/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          res.status === 401
            ? "This server requires authentication to inspect."
            : res.status === 429
              ? "Rate limit reached — try again in a minute."
              : (data?.error as string) || "Scan failed. The server may be unreachable.";
        setState({ status: "error", message: msg });
        return;
      }

      const inspect: InspectResult = await res.json();
      const report = lintMcpServer(inspect);
      setState({ status: "done", report, inspect });
    } catch {
      setState({
        status: "error",
        message: "Could not reach the server. It may be offline or blocked.",
      });
    }
  };

  // Auto-scan on mount
  useEffect(() => {
    runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Quality Report
        </h2>
        {(state.status === "done" || state.status === "error") && (
          <button
            onClick={runScan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Re-scan
          </button>
        )}
      </div>

      {/* Scanning */}
      {state.status === "scanning" && (
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 px-5 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Scanning server…</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspecting tools, resources, and prompts
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {state.status === "error" && (
        <div className="rounded-xl border border-border/40 bg-muted/10 px-5 py-6">
          <div className="flex items-start gap-3">
            {state.message.includes("authentication") ? (
              <Lock className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {state.message.includes("authentication")
                  ? "Authentication required"
                  : "Could not scan server"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{state.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {state.status === "done" && (
        <LintReportView report={state.report} inspect={state.inspect} />
      )}
    </section>
  );
}
