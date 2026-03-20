"use client";

import { useState } from "react";
import { Search, Wrench, FileText, MessageSquare } from "lucide-react";
import type { ToolSchema, ResourceInfo, PromptInfo } from "@/lib/mcp-client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlaygroundTab = "tools" | "resources" | "prompts";

interface ToolSidebarProps {
  tools: ToolSchema[];
  resources: ResourceInfo[];
  prompts: PromptInfo[];
  activeTab: PlaygroundTab;
  onTabChange: (tab: PlaygroundTab) => void;
  selectedItem: string | null;
  onSelect: (name: string) => void;
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabButton({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span className={`text-[10px] tabular-nums ${active ? "text-primary/60" : "text-muted-foreground/40"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ToolSidebar({
  tools,
  resources,
  prompts,
  activeTab,
  onTabChange,
  selectedItem,
  onSelect,
}: ToolSidebarProps) {
  const [query, setQuery] = useState("");

  // Determine what list to show
  const items =
    activeTab === "tools"
      ? tools.map((t) => ({ key: t.name, name: t.name, desc: t.description }))
      : activeTab === "resources"
        ? resources.map((r) => ({ key: r.uri, name: r.name ?? r.uri, desc: r.description }))
        : prompts.map((p) => ({ key: p.name, name: p.name, desc: p.description }));

  const filtered = query
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(query.toLowerCase()) ||
          i.desc?.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  const itemIcon = (isSelected: boolean) =>
    activeTab === "tools" ? (
      <Wrench className={`h-3 w-3 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`} />
    ) : activeTab === "resources" ? (
      <FileText className={`h-3 w-3 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`} />
    ) : (
      <MessageSquare className={`h-3 w-3 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`} />
    );

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="px-3 pt-1 pb-2 border-b border-border/30">
        <div className="flex flex-wrap gap-1">
          <TabButton
            label="Tools"
            count={tools.length}
            active={activeTab === "tools"}
            onClick={() => { onTabChange("tools"); setQuery(""); }}
            icon={<Wrench className="h-3 w-3" />}
          />
          {resources.length > 0 && (
            <TabButton
              label="Resources"
              count={resources.length}
              active={activeTab === "resources"}
              onClick={() => { onTabChange("resources"); setQuery(""); }}
              icon={<FileText className="h-3 w-3" />}
            />
          )}
          {prompts.length > 0 && (
            <TabButton
              label="Prompts"
              count={prompts.length}
              active={activeTab === "prompts"}
              onClick={() => { onTabChange("prompts"); setQuery(""); }}
              icon={<MessageSquare className="h-3 w-3" />}
            />
          )}
        </div>
      </div>

      <div className="px-3 py-2">
        {items.length > 4 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${activeTab}…`}
              className="w-full h-7 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-1 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 px-2 py-4 text-center">
            {query ? `No ${activeTab} found` : `No ${activeTab} available`}
          </p>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedItem === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`w-full text-left rounded-md px-2.5 py-2.5 transition-colors group ${
                  isSelected
                    ? "bg-primary/10 border border-primary/20 text-foreground"
                    : "hover:bg-muted/50 border border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  {itemIcon(isSelected)}
                  <span className="font-mono text-xs font-medium truncate">{item.name}</span>
                </div>
                {item.desc && (
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5 pl-5 line-clamp-1">
                    {item.desc}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
