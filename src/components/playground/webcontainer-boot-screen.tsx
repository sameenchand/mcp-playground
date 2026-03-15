"use client";

import { Loader2, Terminal, AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { SandboxStatus } from "@/lib/webcontainer/use-webcontainer-mcp";

const STEP_LABELS: Record<SandboxStatus, string> = {
  idle: "Preparing...",
  booting: "Starting browser runtime...",
  installing: "Installing package...",
  spawning: "Starting MCP server...",
  connecting: "Connecting to server...",
  ready: "Ready",
  error: "Something went wrong",
};

const STEPS: SandboxStatus[] = ["booting", "installing", "spawning", "connecting"];

interface WebContainerBootScreenProps {
  status: SandboxStatus;
  error?: string;
  installLog: string[];
  packageName: string;
  onRetry: () => void;
}

export function WebContainerBootScreen({
  status,
  error,
  installLog,
  packageName,
  onRetry,
}: WebContainerBootScreenProps) {
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <div className="text-center max-w-md">
          <p className="font-medium text-foreground">Failed to start {packageName}</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>

        {/* Show last install log lines for debugging */}
        {installLog.length > 0 && (
          <div className="w-full max-w-lg rounded-lg bg-muted/20 border border-border/50 p-3 max-h-40 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Terminal className="h-3 w-3" />
              Install output
            </p>
            <pre className="text-xs font-mono text-muted-foreground/70 whitespace-pre-wrap">
              {installLog.slice(-20).join("\n")}
            </pre>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
          <Link
            href="/playground"
            className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 inline mr-1.5" />
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />

      <div className="text-center">
        <p className="font-medium text-foreground">{STEP_LABELS[status]}</p>
        <p className="text-sm text-muted-foreground mt-1 font-mono">{packageName}</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const stepIndex = STEPS.indexOf(status);
          const isDone = i < stepIndex;
          const isActive = step === status;
          return (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`w-6 h-px ${isDone ? "bg-green-500" : "bg-border/50"}`} />
              )}
              <div
                className={`flex items-center gap-1.5 text-xs ${
                  isActive
                    ? "text-primary font-medium"
                    : isDone
                      ? "text-green-500"
                      : "text-muted-foreground/40"
                }`}
              >
                {isDone ? "✓" : isActive ? "●" : "○"}
                <span className="hidden sm:inline">
                  {step === "booting" ? "Boot" : step === "installing" ? "Install" : step === "spawning" ? "Spawn" : "Connect"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Streaming install log */}
      {status === "installing" && installLog.length > 0 && (
        <div className="w-full max-w-lg rounded-lg bg-muted/10 border border-border/30 p-3 max-h-48 overflow-y-auto">
          <pre className="text-xs font-mono text-muted-foreground/60 whitespace-pre-wrap">
            {installLog.slice(-15).join("\n")}
          </pre>
        </div>
      )}

      <p className="text-xs text-muted-foreground/50">
        Running entirely in your browser — nothing is sent to our servers
      </p>
    </div>
  );
}
