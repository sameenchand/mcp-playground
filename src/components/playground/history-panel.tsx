"use client";

import { Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import type { ContentBlock } from "./response-viewer";

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  toolName: string;
  args: Record<string, unknown>;
  result: { content: ContentBlock[]; isError?: boolean } | null;
  error: string | null;
  executionTimeMs: number;
  warning?: string;
}

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onReplay: (entry: HistoryEntry) => void;
  onClear: () => void;
  activeId?: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function previewArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return "no args";
  const first = entries.slice(0, 2).map(([k, v]) => {
    const val = typeof v === "object" ? "{…}" : String(v).slice(0, 20);
    return `${k}=${val}`;
  });
  return first.join(", ") + (entries.length > 2 ? ", …" : "");
}

export function HistoryPanel({ entries, onReplay, onClear, activeId }: HistoryPanelProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground/50 text-xs">
        No executions yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          History ({entries.length})
        </span>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      {entries.map((entry) => {
        const isActive = entry.id === activeId;
        const success = entry.result !== null && !entry.result.isError;
        const toolError = entry.result?.isError;
        const systemError = entry.error !== null;

        return (
          <button
            key={entry.id}
            onClick={() => onReplay(entry)}
            className={`w-full text-left rounded-md px-2.5 py-2 transition-colors ${
              isActive
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-muted/50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              {systemError ? (
                <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              ) : toolError ? (
                <XCircle className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              ) : success ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="font-mono text-xs text-foreground truncate flex-1">
                {entry.toolName}
              </span>
              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                {entry.executionTimeMs}ms
              </span>
            </div>
            <div className="mt-0.5 pl-5">
              <p className="text-[10px] text-muted-foreground/60 truncate">{previewArgs(entry.args)}</p>
              <p className="text-[10px] text-muted-foreground/40">{timeAgo(entry.timestamp)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
