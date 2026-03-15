"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Check, Zap, Radio, Unplug } from "lucide-react";
import type { InspectResult } from "@/lib/mcp-client";

interface ConnectionHeaderProps {
  serverUrl: string;
  inspectResult: InspectResult | null;
  onShare?: () => void;
}

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function ConnectionHeader({ serverUrl, inspectResult }: ConnectionHeaderProps) {
  const truncatedUrl = serverUrl.length > 60 ? `${serverUrl.slice(0, 57)}…` : serverUrl;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-muted/5 text-sm flex-wrap">
      {/* Status dot */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="font-medium text-foreground">
          {inspectResult?.serverInfo.name ?? "Connected"}
        </span>
        {inspectResult?.serverInfo.version && (
          <span className="text-xs text-muted-foreground font-mono">
            v{inspectResult.serverInfo.version}
          </span>
        )}
      </div>

      {/* Transport badge */}
      {inspectResult?.transport && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
            inspectResult.transport === "streamable-http"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
          }`}
        >
          {inspectResult.transport === "streamable-http" ? (
            <Zap className="h-2.5 w-2.5" />
          ) : (
            <Radio className="h-2.5 w-2.5" />
          )}
          {inspectResult.transport === "streamable-http" ? "Streamable HTTP" : "SSE"}
        </span>
      )}

      {/* URL */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground/70 font-mono min-w-0">
        <span className="truncate">{truncatedUrl}</span>
        <CopyUrlButton url={serverUrl} />
      </div>

      {/* Disconnect */}
      <Link
        href="/connect"
        className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <Unplug className="h-3.5 w-3.5" />
        Disconnect
      </Link>
    </div>
  );
}
