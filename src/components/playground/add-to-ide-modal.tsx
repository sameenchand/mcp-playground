"use client";

import { useState } from "react";
import { X, Copy, Check, Terminal, Monitor, Code2 } from "lucide-react";

interface AddToIdeModalProps {
  open: boolean;
  onClose: () => void;
  serverUrl: string;
  serverName: string;
  transport?: string;
}

type Tab = "claude-desktop" | "cursor" | "claude-code";

function serverSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AddToIdeModal({
  open,
  onClose,
  serverUrl,
  serverName,
  transport,
}: AddToIdeModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("claude-desktop");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const slug = serverSlug(serverName) || "mcp-server";

  const mcpJson = JSON.stringify(
    { mcpServers: { [slug]: { url: serverUrl } } },
    null,
    2,
  );

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    code: string;
    language: string;
    instructions: string;
    filepath: string;
  }[] = [
    {
      id: "claude-desktop",
      label: "Claude Desktop",
      icon: <Monitor className="h-3.5 w-3.5" />,
      code: mcpJson,
      language: "json",
      instructions:
        "Merge this snippet into your claude_desktop_config.json, then restart Claude Desktop.",
      filepath:
        "~/Library/Application Support/Claude/claude_desktop_config.json",
    },
    {
      id: "cursor",
      label: "Cursor / Windsurf",
      icon: <Code2 className="h-3.5 w-3.5" />,
      code: mcpJson,
      language: "json",
      instructions:
        "Add this to your global ~/.cursor/mcp.json or a project-local .cursor/mcp.json file.",
      filepath: "~/.cursor/mcp.json",
    },
    {
      id: "claude-code",
      label: "Claude Code",
      icon: <Terminal className="h-3.5 w-3.5" />,
      code: `claude mcp add --transport http ${slug} ${serverUrl}`,
      language: "bash",
      instructions:
        "Run this command in your terminal. The server will be available in all Claude Code sessions.",
      filepath: "",
    },
  ];

  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  const handleCopy = () => {
    void navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-background border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border/50">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Add to IDE</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add{" "}
              <span className="font-mono text-foreground">{serverName}</span> to
              your AI coding environment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50 px-5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCopied(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground">{current.instructions}</p>

          {/* Code block */}
          <div className="relative group">
            <pre className="bg-muted/30 border border-border/50 rounded-lg px-4 py-3.5 text-xs font-mono text-foreground overflow-x-auto whitespace-pre leading-relaxed">
              {current.code}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/90 border border-border/60 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Filepath hint */}
          {current.filepath && (
            <p className="text-[11px] text-muted-foreground/50 font-mono">
              {current.filepath}
            </p>
          )}

          {/* SSE transport note */}
          {transport === "sse" && (
            <p className="text-[11px] text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/20 rounded-md px-3 py-2">
              This server uses SSE transport. Make sure your client supports SSE
              (Claude Desktop v0.7+ required).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
