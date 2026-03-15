"use client";

import { useState } from "react";
import {
  Wrench,
  Database,
  MessageSquare,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SchemaViewer } from "@/components/inspector/schema-viewer";
import type { InspectResult } from "@/lib/mcp-client";

type Tab = "overview" | "tools" | "resources" | "prompts";

interface InspectorResultsProps {
  result: InspectResult;
  onTryTool?: (toolName: string) => void;
}

function CapabilityBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        enabled
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-muted/30 text-muted-foreground border border-border/50"
      }`}
    >
      {enabled ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

function ToolCard({ tool, onTry }: { tool: InspectResult["tools"][0]; onTry?: () => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      {/* Header row — split into clickable expand area and action buttons */}
      <div className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
        <button
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span className="p-1.5 rounded-md bg-muted border border-border/50 shrink-0">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm font-medium text-foreground">{tool.name}</p>
            {tool.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{tool.description}</p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {onTry && (
            <button
              onClick={onTry}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              Try it <ArrowRight className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/30 pt-3">
          {tool.description && (
            <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
          )}
          <SchemaViewer schema={tool.inputSchema as Parameters<typeof SchemaViewer>[0]["schema"]} />
        </div>
      )}
    </div>
  );
}

export function InspectorResults({ result, onTryTool }: InspectorResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "tools", label: "Tools", icon: Wrench, count: result.tools.length },
    { id: "resources", label: "Resources", icon: Database, count: result.resources.length },
    { id: "prompts", label: "Prompts", icon: MessageSquare, count: result.prompts.length },
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Server header */}
      <div className="p-5 border-b border-border/50 bg-muted/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{result.serverInfo.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="font-mono text-xs">
                v{result.serverInfo.version}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  result.transport === "streamable-http"
                    ? "text-blue-400 border-blue-500/30 bg-blue-500/5"
                    : "text-yellow-400 border-yellow-500/30 bg-yellow-500/5"
                }`}
              >
                <Zap className="h-3 w-3 mr-1" />
                {result.transport === "streamable-http" ? "Streamable HTTP" : "SSE"}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Connected in {result.connectionTimeMs}ms
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CapabilityBadge enabled={result.capabilities.tools} label="Tools" />
            <CapabilityBadge enabled={result.capabilities.resources} label="Resources" />
            <CapabilityBadge enabled={result.capabilities.prompts} label="Prompts" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Tools", value: result.tools.length, enabled: result.capabilities.tools },
                { label: "Resources", value: result.resources.length, enabled: result.capabilities.resources },
                { label: "Prompts", value: result.prompts.length, enabled: result.capabilities.prompts },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border/50 bg-muted/10 p-4 text-center"
                >
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  {!stat.enabled && stat.value === 0 && (
                    <p className="text-xs text-muted-foreground/60 mt-1">not advertised</p>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-3">
            {result.tools.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No tools available</p>
            ) : (
              result.tools.map((tool) => (
                <ToolCard
                  key={tool.name}
                  tool={tool}
                  onTry={onTryTool ? () => onTryTool(tool.name) : undefined}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "resources" && (
          <div className="space-y-3">
            {result.resources.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No resources available</p>
            ) : (
              result.resources.map((resource) => (
                <div
                  key={resource.uri}
                  className="rounded-lg border border-border/50 bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="p-1.5 rounded-md bg-muted border border-border/50 shrink-0 mt-0.5">
                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium text-foreground truncate">
                        {resource.name ?? resource.uri}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5 truncate">
                        {resource.uri}
                      </p>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                      )}
                      {resource.mimeType && (
                        <Badge variant="outline" className="text-xs mt-2">
                          {resource.mimeType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "prompts" && (
          <div className="space-y-3">
            {result.prompts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No prompts available</p>
            ) : (
              result.prompts.map((prompt) => (
                <div
                  key={prompt.name}
                  className="rounded-lg border border-border/50 bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="p-1.5 rounded-md bg-muted border border-border/50 shrink-0 mt-0.5">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium text-foreground">{prompt.name}</p>
                      {prompt.description && (
                        <p className="text-sm text-muted-foreground mt-1">{prompt.description}</p>
                      )}
                      {prompt.arguments && prompt.arguments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            Arguments
                          </p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border/30">
                                <th className="text-left pb-1.5 font-medium text-muted-foreground">
                                  Name
                                </th>
                                <th className="text-left pb-1.5 font-medium text-muted-foreground">
                                  Required
                                </th>
                                <th className="text-left pb-1.5 font-medium text-muted-foreground">
                                  Description
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {prompt.arguments.map((arg) => (
                                <tr key={arg.name} className="border-b border-border/20">
                                  <td className="py-1.5 font-mono text-foreground pr-4">
                                    {arg.name}
                                    {arg.required && (
                                      <span className="text-red-400 ml-0.5">*</span>
                                    )}
                                  </td>
                                  <td className="py-1.5 pr-4">
                                    {arg.required ? (
                                      <span className="text-green-400">yes</span>
                                    ) : (
                                      <span className="text-muted-foreground">no</span>
                                    )}
                                  </td>
                                  <td className="py-1.5 text-muted-foreground">
                                    {arg.description ?? "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
