"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle, Clock, Image as ImageIcon, Link } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TextBlock = { type: "text"; text: string };
type ImageBlock = { type: "image"; data: string; mimeType: string };
type ResourceBlock = {
  type: "resource";
  resource: { uri: string; text?: string; blob?: string; mimeType?: string };
};
export type ContentBlock = TextBlock | ImageBlock | ResourceBlock;

export interface ToolResult {
  content: ContentBlock[];
  isError?: boolean;
}

export interface ResponseViewerProps {
  result: ToolResult | null;
  executionTimeMs: number | null;
  isLoading?: boolean;
  warning?: string;
}

// ── JSON syntax highlighter (no deps) ────────────────────────────────────────

function JsonNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const indent = depth * 16;

  if (value === null) return <span className="text-muted-foreground">null</span>;
  if (typeof value === "boolean") return <span className="text-orange-400">{String(value)}</span>;
  if (typeof value === "number") return <span className="text-green-400">{String(value)}</span>;
  if (typeof value === "string") return <span className="text-blue-300">&quot;{value}&quot;</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">[]</span>;
    return (
      <span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-yellow-400 hover:opacity-70 transition-opacity"
        >
          [{collapsed ? `…${value.length} items` : ""}]
        </button>
        {!collapsed && (
          <>
            {"\n"}
            {value.map((item, i) => (
              <span key={i}>
                {" ".repeat(indent + 16)}
                <JsonNode value={item} depth={depth + 1} />
                {i < value.length - 1 ? "," : ""}
                {"\n"}
              </span>
            ))}
            {" ".repeat(indent)}
            <span className="text-yellow-400">]</span>
          </>
        )}
      </span>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-muted-foreground">{"{}"}</span>;
    return (
      <span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-purple-400 hover:opacity-70 transition-opacity"
        >
          {"{"}
          {collapsed ? `…${entries.length} keys` : ""}
          {collapsed ? "}" : ""}
        </button>
        {!collapsed && (
          <>
            {"\n"}
            {entries.map(([k, v], i) => (
              <span key={k}>
                {" ".repeat(indent + 16)}
                <span className="text-blue-200">&quot;{k}&quot;</span>
                <span className="text-muted-foreground">: </span>
                <JsonNode value={v} depth={depth + 1} />
                {i < entries.length - 1 ? "," : ""}
                {"\n"}
              </span>
            ))}
            {" ".repeat(indent)}
            <span className="text-purple-400">{"}"}</span>
          </>
        )}
      </span>
    );
  }

  return <span>{String(value)}</span>;
}

function HighlightedJson({ text }: { text: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return <pre className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">{text}</pre>;
  }
  return (
    <pre className="text-sm font-mono whitespace-pre overflow-x-auto">
      <JsonNode value={parsed} />
    </pre>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Content block renderers ───────────────────────────────────────────────────

function TextBlock({ block }: { block: TextBlock }) {
  const isJson = block.text.trimStart().startsWith("{") || block.text.trimStart().startsWith("[");
  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={block.text} />
      </div>
      <div className="rounded-md bg-muted/20 border border-border/40 p-4 overflow-auto max-h-[500px]">
        {isJson ? (
          <HighlightedJson text={block.text} />
        ) : (
          <pre className="text-sm font-mono text-foreground whitespace-pre-wrap break-words">{block.text}</pre>
        )}
      </div>
    </div>
  );
}

function ImageBlock({ block }: { block: ImageBlock }) {
  return (
    <div className="rounded-md border border-border/40 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 border-b border-border/40">
        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{block.mimeType}</span>
        <a
          href={`data:${block.mimeType};base64,${block.data}`}
          download="image"
          className="ml-auto text-xs text-primary hover:underline"
        >
          Download
        </a>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:${block.mimeType};base64,${block.data}`}
        alt="Tool response image"
        className="max-w-full"
      />
    </div>
  );
}

function ResourceBlock({ block }: { block: ResourceBlock }) {
  return (
    <div className="rounded-md border border-border/40 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Link className="h-3.5 w-3.5 text-muted-foreground" />
        <a
          href={block.resource.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-mono text-primary hover:underline truncate"
        >
          {block.resource.uri}
        </a>
      </div>
      {block.resource.text && (
        <pre className="text-sm font-mono text-foreground whitespace-pre-wrap bg-muted/20 p-3 rounded">
          {block.resource.text}
        </pre>
      )}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ResponseSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="rounded-md bg-muted/20 border border-border/40 p-4 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ResponseViewer({ result, executionTimeMs, isLoading, warning }: ResponseViewerProps) {
  if (isLoading) return <ResponseSkeleton />;

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center mb-3">
          <span className="text-2xl">▶</span>
        </div>
        <p className="text-sm">Run a tool to see the response here</p>
      </div>
    );
  }

  const isError = result.isError === true;

  return (
    <div className="space-y-3">
      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-400 font-medium">Tool returned an error</span>
        </div>
      )}

      {/* Warning */}
      {warning && (
        <div className="px-3 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
          {warning}
        </div>
      )}

      {/* Content blocks */}
      <div className={`space-y-3 ${isError ? "ring-1 ring-red-500/20 rounded-lg p-3" : ""}`}>
        {result.content.map((block, i) => {
          if (block.type === "text") return <TextBlock key={i} block={block} />;
          if (block.type === "image") return <ImageBlock key={i} block={block} />;
          if (block.type === "resource") return <ResourceBlock key={i} block={block} />;
          return null;
        })}
        {result.content.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Empty response.</p>
        )}
      </div>

      {/* Footer: execution time */}
      {executionTimeMs !== null && (
        <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground/60">
          <Clock className="h-3 w-3" />
          Executed in {executionTimeMs}ms
        </div>
      )}
    </div>
  );
}
