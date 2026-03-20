"use client";

import { useState, useCallback } from "react";
import { Loader2, Download, FileText, AlertCircle, Globe } from "lucide-react";

interface ResourceContent {
  uri: string;
  text?: string;
  blob?: string;
  mimeType?: string;
}

interface ReadResourceResult {
  contents: ResourceContent[];
}

interface ResourceViewerProps {
  serverUrl: string;
  resourceUri: string;
  resourceName?: string;
  resourceDescription?: string;
  resourceMimeType?: string;
  authHeaders: Record<string, string>;
}

function ContentBlock({ content }: { content: ResourceContent }) {
  const mimeType = content.mimeType ?? "text/plain";
  const isImage = mimeType.startsWith("image/");
  const isJson = mimeType === "application/json" || content.text?.trim().startsWith("{") || content.text?.trim().startsWith("[");

  if (isImage && content.blob) {
    return (
      <div className="space-y-2">
        <img
          src={`data:${mimeType};base64,${content.blob}`}
          alt={content.uri}
          className="max-w-full rounded-lg border border-border/30"
        />
      </div>
    );
  }

  if (content.text) {
    let formatted = content.text;
    if (isJson) {
      try {
        formatted = JSON.stringify(JSON.parse(content.text), null, 2);
      } catch {
        // Not valid JSON, display as-is
      }
    }
    return (
      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed bg-muted/20 border border-border/30 rounded-lg p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
        {formatted}
      </pre>
    );
  }

  if (content.blob) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border/30 bg-muted/10">
        <Download className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">Binary content</p>
          <p className="text-xs text-muted-foreground">
            {mimeType} · {Math.round(content.blob.length * 0.75).toLocaleString()} bytes
          </p>
        </div>
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground italic">Empty content</p>
  );
}

export function ResourceViewer({
  serverUrl,
  resourceUri,
  resourceName,
  resourceDescription,
  resourceMimeType,
  authHeaders,
}: ResourceViewerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<ReadResourceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);

  const handleRead = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/mcp/read-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: serverUrl, resourceUri, headers: authHeaders }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to read resource.");
        setStatus("error");
        return;
      }

      setResult(data.result as ReadResourceResult);
      setExecTime(data.executionTimeMs ?? null);
      setStatus("done");
    } catch {
      setError("Network error — check your connection.");
      setStatus("error");
    }
  }, [serverUrl, resourceUri, authHeaders]);

  return (
    <div className="space-y-4">
      {/* Resource header */}
      <div className="pb-3 border-b border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-mono text-base font-semibold text-foreground">
            {resourceName ?? resourceUri}
          </h2>
        </div>
        {resourceDescription && (
          <p className="text-sm text-muted-foreground mt-1">{resourceDescription}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Globe className="h-3 w-3" />
            <span className="font-mono">{resourceUri}</span>
          </div>
          {resourceMimeType && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/30">
              {resourceMimeType}
            </span>
          )}
        </div>
      </div>

      {/* Read button */}
      <button
        onClick={() => void handleRead()}
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reading…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Read Resource
          </>
        )}
      </button>

      {/* Error */}
      {status === "error" && error && (
        <div className="p-3 rounded-md bg-red-500/5 border border-red-500/20 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {status === "done" && result && (
        <div className="space-y-3">
          {execTime !== null && (
            <p className="text-[10px] text-muted-foreground/50">
              Read in {execTime}ms
            </p>
          )}
          {result.contents.map((content, i) => (
            <ContentBlock key={i} content={content} />
          ))}
        </div>
      )}
    </div>
  );
}
