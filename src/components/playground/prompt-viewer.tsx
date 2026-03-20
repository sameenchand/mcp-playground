"use client";

import { useState, useCallback } from "react";
import { Loader2, MessageSquare, AlertCircle, Play, User, Bot } from "lucide-react";
import type { PromptInfo } from "@/lib/mcp-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PromptMessage {
  role: "user" | "assistant";
  content:
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
    | { type: "resource"; resource: { uri: string; text?: string; mimeType?: string } };
}

interface GetPromptResult {
  description?: string;
  messages: PromptMessage[];
}

interface PromptViewerProps {
  serverUrl: string;
  prompt: PromptInfo;
  authHeaders: Record<string, string>;
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: PromptMessage }) {
  const isUser = message.role === "user";
  const Icon = isUser ? User : Bot;

  const renderContent = () => {
    const content = message.content;
    if (typeof content === "string") {
      return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    }
    if (content.type === "text") {
      return <p className="text-sm whitespace-pre-wrap">{content.text}</p>;
    }
    if (content.type === "image") {
      return (
        <img
          src={`data:${content.mimeType};base64,${content.data}`}
          alt="Prompt image"
          className="max-w-full rounded-md"
        />
      );
    }
    if (content.type === "resource") {
      return (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground font-mono mb-1">{content.resource.uri}</p>
          {content.resource.text && (
            <pre className="text-xs whitespace-pre-wrap bg-muted/30 rounded p-2 border border-border/30">
              {content.resource.text}
            </pre>
          )}
        </div>
      );
    }
    // Fallback for when content is an array or other shape
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className={`flex gap-3 ${isUser ? "" : ""}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
        isUser ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
      }`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">
          {message.role}
        </p>
        <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PromptViewer({ serverUrl, prompt, authHeaders }: PromptViewerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<GetPromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);

  // Argument form state
  const hasArgs = prompt.arguments && prompt.arguments.length > 0;
  const [argValues, setArgValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    prompt.arguments?.forEach((a) => { init[a.name] = ""; });
    return init;
  });
  const [argErrors, setArgErrors] = useState<Record<string, string>>({});

  const handleGetPrompt = useCallback(async () => {
    // Validate required args
    if (hasArgs) {
      const errs: Record<string, string> = {};
      prompt.arguments!.forEach((a) => {
        if (a.required && (!argValues[a.name] || argValues[a.name].trim() === "")) {
          errs[a.name] = "This field is required";
        }
      });
      if (Object.keys(errs).length > 0) {
        setArgErrors(errs);
        return;
      }
    }

    setStatus("loading");
    setError(null);
    setResult(null);
    setArgErrors({});

    // Only include non-empty args
    const args: Record<string, string> = {};
    for (const [k, v] of Object.entries(argValues)) {
      if (v.trim() !== "") args[k] = v;
    }

    try {
      const res = await fetch("/api/mcp/get-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: serverUrl, promptName: prompt.name, args, headers: authHeaders }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to get prompt.");
        setStatus("error");
        return;
      }

      setResult(data.result as GetPromptResult);
      setExecTime(data.executionTimeMs ?? null);
      setStatus("done");
    } catch {
      setError("Network error — check your connection.");
      setStatus("error");
    }
  }, [serverUrl, prompt, argValues, hasArgs, authHeaders]);

  const isLoading = status === "loading";

  return (
    <div className="space-y-4">
      {/* Prompt header */}
      <div className="pb-3 border-b border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="font-mono text-base font-semibold text-foreground">
            {prompt.name}
          </h2>
        </div>
        {prompt.description && (
          <p className="text-sm text-muted-foreground mt-1">{prompt.description}</p>
        )}
      </div>

      {/* Argument form */}
      {hasArgs && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Arguments
          </p>
          {prompt.arguments!.map((arg) => (
            <div key={arg.name}>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <span className="font-mono text-xs">{arg.name}</span>
                {arg.required && <span className="text-red-400 text-xs">*</span>}
              </label>
              {arg.description && (
                <p className="text-xs text-muted-foreground/60 mb-1.5">{arg.description}</p>
              )}
              <input
                type="text"
                value={argValues[arg.name] ?? ""}
                onChange={(e) => {
                  setArgValues((prev) => ({ ...prev, [arg.name]: e.target.value }));
                  if (argErrors[arg.name]) {
                    setArgErrors((prev) => {
                      const next = { ...prev };
                      delete next[arg.name];
                      return next;
                    });
                  }
                }}
                placeholder={arg.description ?? `Enter ${arg.name}…`}
                className={`w-full h-9 px-3 text-sm rounded-md border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  argErrors[arg.name] ? "border-red-500/50 ring-1 ring-red-500/30" : "border-border"
                }`}
              />
              {argErrors[arg.name] && (
                <p className="text-xs text-red-400 mt-1">{argErrors[arg.name]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Get Prompt button */}
      <button
        onClick={() => void handleGetPrompt()}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Expanding…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Get Prompt
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

      {/* Result — expanded messages */}
      {status === "done" && result && (
        <div className="space-y-3">
          {execTime !== null && (
            <p className="text-[10px] text-muted-foreground/50">
              Expanded in {execTime}ms
            </p>
          )}
          {result.description && (
            <p className="text-xs text-muted-foreground italic mb-2">{result.description}</p>
          )}
          <div className="space-y-4">
            {result.messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
