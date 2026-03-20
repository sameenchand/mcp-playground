"use client";

import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Wrench,
  Database,
  MessageSquare,
  Server,
  Coins,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type { LintReport, LintIssue, Severity } from "@/lib/schema-linter";
import type { InspectResult } from "@/lib/mcp-client";

// ── Grade badge ────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  A: "from-green-500 to-emerald-600 text-white",
  B: "from-blue-500 to-cyan-600 text-white",
  C: "from-yellow-500 to-amber-600 text-white",
  D: "from-orange-500 to-red-500 text-white",
  F: "from-red-600 to-red-800 text-white",
};

const GRADE_LABELS: Record<string, string> = {
  A: "Excellent",
  B: "Good",
  C: "Needs Work",
  D: "Poor",
  F: "Critical Issues",
};

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${GRADE_COLORS[grade] ?? GRADE_COLORS.F} flex items-center justify-center shadow-lg`}
      >
        <span className="text-4xl font-bold">{grade}</span>
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">
          {GRADE_LABELS[grade] ?? "Unknown"}
        </p>
        <p className="text-sm text-muted-foreground">
          Score: {score}/100
        </p>
      </div>
    </div>
  );
}

// ── Severity icon ──────────────────────────────────────────────────────────

function SeverityIcon({ severity }: { severity: Severity }) {
  switch (severity) {
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
    case "warning":
      return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
    case "info":
      return <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
  }
}

function severityBg(severity: Severity): string {
  switch (severity) {
    case "error":
      return "bg-red-500/5 border-red-500/20";
    case "warning":
      return "bg-yellow-500/5 border-yellow-500/20";
    case "info":
      return "bg-blue-500/5 border-blue-500/20";
  }
}

// ── Category icon ──────────────────────────────────────────────────────────

function CategoryIcon({ category }: { category: LintIssue["category"] }) {
  switch (category) {
    case "tool":
      return <Wrench className="h-3 w-3" />;
    case "resource":
      return <Database className="h-3 w-3" />;
    case "prompt":
      return <MessageSquare className="h-3 w-3" />;
    case "server":
      return <Server className="h-3 w-3" />;
  }
}

// ── Token bar ──────────────────────────────────────────────────────────────

function TokenBar({
  name,
  tokens,
  maxTokens,
}: {
  name: string;
  tokens: number;
  maxTokens: number;
}) {
  const pct = maxTokens > 0 ? Math.min((tokens / maxTokens) * 100, 100) : 0;
  const color =
    tokens > 500 ? "bg-red-500" : tokens > 200 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="flex items-center gap-3">
      <p className="font-mono text-xs text-foreground truncate w-40 shrink-0">
        {name}
      </p>
      <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums w-16 text-right shrink-0">
        ~{tokens} tok
      </p>
    </div>
  );
}

// ── Issue group ────────────────────────────────────────────────────────────

function IssueGroup({
  target,
  category,
  issues,
}: {
  target: string;
  category: LintIssue["category"];
  issues: LintIssue[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full p-3 hover:bg-muted/20 transition-colors text-left"
      >
        <span className="p-1 rounded bg-muted border border-border/50">
          <CategoryIcon category={category} />
        </span>
        <span className="font-mono text-sm text-foreground flex-1 truncate">
          {target}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {issues.filter((i) => i.severity === "error").length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              {issues.filter((i) => i.severity === "error").length} error
              {issues.filter((i) => i.severity === "error").length !== 1 ? "s" : ""}
            </span>
          )}
          {issues.filter((i) => i.severity === "warning").length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              {issues.filter((i) => i.severity === "warning").length} warn
            </span>
          )}
          {issues.filter((i) => i.severity === "info").length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {issues.filter((i) => i.severity === "info").length} info
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border/30 divide-y divide-border/20">
          {issues.map((issue, i) => (
            <div
              key={`${issue.rule}-${i}`}
              className={`flex items-start gap-2.5 px-4 py-2.5 ${severityBg(issue.severity)}`}
            >
              <SeverityIcon severity={issue.severity} />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{issue.message}</p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                  {issue.rule}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main report ────────────────────────────────────────────────────────────

interface LintReportViewProps {
  report: LintReport;
  inspect: InspectResult;
}

export function LintReportView({ report, inspect }: LintReportViewProps) {
  // Group issues by target
  const grouped = new Map<string, { category: LintIssue["category"]; issues: LintIssue[] }>();
  for (const issue of report.issues) {
    const key = `${issue.category}:${issue.target}`;
    if (!grouped.has(key)) {
      grouped.set(key, { category: issue.category, issues: [] });
    }
    grouped.get(key)!.issues.push(issue);
  }

  const maxToolTokens = Math.max(
    ...report.tokenEstimate.perTool.map((t) => t.tokens),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Grade + Summary */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <GradeBadge grade={report.grade} score={report.score} />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-400">{report.summary.errors}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{report.summary.warnings}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{report.summary.infos}</p>
              <p className="text-xs text-muted-foreground">Info</p>
            </div>
          </div>
        </div>

        {/* Server info bar */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-border/50">
          <span className="text-sm font-medium text-foreground">{inspect.serverInfo.name}</span>
          <span className="text-xs text-muted-foreground font-mono">v{inspect.serverInfo.version}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {inspect.tools.length} tools, {inspect.resources.length} resources, {inspect.prompts.length} prompts
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground capitalize">{inspect.transport}</span>
        </div>
      </div>

      {/* Token Estimate */}
      {report.tokenEstimate.perTool.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Token Cost Estimate</h3>
            <span className="ml-auto text-sm font-mono text-foreground">
              ~{report.tokenEstimate.total.toLocaleString()} tokens total
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Estimated tokens consumed when loading all tool definitions into an LLM context window.
            Lower is better — aim for under 200 tokens per tool.
          </p>
          <div className="space-y-2">
            {report.tokenEstimate.perTool
              .sort((a, b) => b.tokens - a.tokens)
              .map((tool) => (
                <TokenBar
                  key={tool.name}
                  name={tool.name}
                  tokens={tool.tokens}
                  maxTokens={maxToolTokens}
                />
              ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {report.issues.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Issues ({report.issues.length})
          </h3>
          {[...grouped.entries()].map(([key, { category, issues }]) => (
            <IssueGroup
              key={key}
              target={issues[0]?.target ?? key}
              category={category}
              issues={issues}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-green-500">No issues found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This server follows all MCP best practices. Nice work!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
