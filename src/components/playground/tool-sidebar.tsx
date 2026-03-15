"use client";

import { useState } from "react";
import { Search, Wrench } from "lucide-react";
import type { ToolSchema } from "@/lib/mcp-client";

interface ToolSidebarProps {
  tools: ToolSchema[];
  selectedTool: string | null;
  onSelect: (toolName: string) => void;
}

export function ToolSidebar({ tools, selectedTool, onSelect }: ToolSidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : tools;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tools
          </span>
          <span className="text-xs text-muted-foreground/60">{tools.length}</span>
        </div>

        {tools.length > 4 && (
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              className="w-full h-7 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-1 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 px-2 py-4 text-center">No tools found</p>
        ) : (
          filtered.map((tool) => (
            <button
              key={tool.name}
              onClick={() => onSelect(tool.name)}
              className={`w-full text-left rounded-md px-2.5 py-2.5 transition-colors group ${
                selectedTool === tool.name
                  ? "bg-primary/10 border border-primary/20 text-foreground"
                  : "hover:bg-muted/50 border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Wrench
                  className={`h-3 w-3 shrink-0 ${selectedTool === tool.name ? "text-primary" : "text-muted-foreground/50"}`}
                />
                <span className="font-mono text-xs font-medium truncate">{tool.name}</span>
              </div>
              {tool.description && (
                <p className="text-[10px] text-muted-foreground/50 mt-0.5 pl-5 line-clamp-1">
                  {tool.description}
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
