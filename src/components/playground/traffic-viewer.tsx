"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, ChevronRight, ChevronDown, Copy, Check } from "lucide-react";

export interface TrafficEntry {
  direction: "tx" | "rx";
  timestamp: number;
  message: Record<string, unknown>;
}

interface TrafficViewerProps {
  entries: TrafficEntry[];
}

// ── JSON-RPC method label ────────────────────────────────────────────────────

function getLabel(msg: Record<string, unknown>): string {
  if ("method" in msg && typeof msg.method === "string") {
    return msg.method;
  }
  if ("result" in msg) {
    return "result";
  }
  if ("error" in msg) {
    return "error";
  }
  return "message";
}

function getIdLabel(msg: Record<string, unknown>): string | null {
  if ("id" in msg && msg.id !== undefined) {
    return `#${msg.id}`;
  }
  return null;
}

// ── Collapsible JSON ─────────────────────────────────────────────────────────

function JsonBlock({ data }: { data: unknown }) {
  const text = JSON.stringify(data, null, 2);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group">
      <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed bg-muted/10 rounded-md p-3 overflow-x-auto max-h-96 overflow-y-auto">
        {text}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-muted/50 hover:bg-muted text-muted-foreground"
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

// ── Single traffic entry ─────────────────────────────────────────────────────

function TrafficRow({ entry, baseTimestamp }: { entry: TrafficEntry; baseTimestamp: number }) {
  const [expanded, setExpanded] = useState(false);

  const isTx = entry.direction === "tx";
  const label = getLabel(entry.message);
  const idLabel = getIdLabel(entry.message);
  const offsetMs = entry.timestamp - baseTimestamp;

  // Color coding
  const dirColor = isTx ? "text-blue-400" : "text-green-400";
  const dirBg = isTx ? "bg-blue-500/5 border-blue-500/10" : "bg-green-500/5 border-green-500/10";
  const DirIcon = isTx ? ArrowUp : ArrowDown;
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className={`rounded-md border ${dirBg}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/10 transition-colors"
      >
        <Chevron className="h-3 w-3 text-muted-foreground/50 shrink-0" />
        <DirIcon className={`h-3 w-3 shrink-0 ${dirColor}`} />
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${dirColor}`}>
          {isTx ? "TX" : "RX"}
        </span>
        <span className="text-xs font-mono font-medium text-foreground truncate">
          {label}
        </span>
        {idLabel && (
          <span className="text-[10px] font-mono text-muted-foreground/50">{idLabel}</span>
        )}
        <span className="ml-auto text-[10px] tabular-nums text-muted-foreground/40 shrink-0">
          +{offsetMs}ms
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          <JsonBlock data={entry.message} />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TrafficViewer({ entries }: TrafficViewerProps) {
  if (entries.length === 0) {
    return (
      <div className="text-xs text-muted-foreground/50 text-center py-8">
        No traffic captured yet. Run a tool with the traffic inspector enabled.
      </div>
    );
  }

  const baseTimestamp = entries[0].timestamp;
  const txCount = entries.filter((e) => e.direction === "tx").length;
  const rxCount = entries.filter((e) => e.direction === "rx").length;

  return (
    <div className="space-y-2">
      {/* Summary */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 pb-1">
        <span>{entries.length} messages</span>
        <span className="text-blue-400">{txCount} sent</span>
        <span className="text-green-400">{rxCount} received</span>
        <span>
          {entries.length > 1
            ? `${entries[entries.length - 1].timestamp - baseTimestamp}ms total`
            : ""}
        </span>
      </div>

      {/* Message list */}
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <TrafficRow key={i} entry={entry} baseTimestamp={baseTimestamp} />
        ))}
      </div>
    </div>
  );
}
