/**
 * Schema Linter — analyzes MCP server inspect results and grades quality.
 *
 * Checks tool descriptions, JSON Schema completeness, resource/prompt metadata,
 * and estimates token cost. Returns a structured report with per-item issues
 * and an overall letter grade.
 */

import type { InspectResult, ToolSchema, ResourceInfo, PromptInfo } from "@/lib/mcp-client";

// ── Types ──────────────────────────────────────────────────────────────────

export type Severity = "error" | "warning" | "info";

export interface LintIssue {
  /** Which item this issue belongs to (tool/resource/prompt name, or "server") */
  target: string;
  /** Category: "tool" | "resource" | "prompt" | "server" */
  category: "tool" | "resource" | "prompt" | "server";
  severity: Severity;
  /** Short rule ID for programmatic use */
  rule: string;
  /** Human-readable message */
  message: string;
}

export interface TokenEstimate {
  /** Total estimated tokens across all tool definitions */
  total: number;
  /** Per-tool breakdown */
  perTool: Array<{ name: string; tokens: number }>;
}

export interface LintReport {
  /** Overall grade: A, B, C, D, or F */
  grade: "A" | "B" | "C" | "D" | "F";
  /** Numeric score 0-100 */
  score: number;
  /** All issues found */
  issues: LintIssue[];
  /** Token estimate for tool definitions */
  tokenEstimate: TokenEstimate;
  /** Summary counts */
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    toolsChecked: number;
    resourcesChecked: number;
    promptsChecked: number;
  };
}

// ── Token estimation ───────────────────────────────────────────────────────

/**
 * Rough token estimate: ~4 chars per token for English text,
 * ~3 chars per token for JSON/code. This is intentionally conservative.
 */
function estimateTokens(text: string): number {
  // JSON-heavy content averages ~3.5 chars/token
  return Math.ceil(text.length / 3.5);
}

function estimateToolTokens(tool: ToolSchema): number {
  let text = tool.name;
  if (tool.description) text += " " + tool.description;
  text += " " + JSON.stringify(tool.inputSchema);
  return estimateTokens(text);
}

// ── Lint rules ─────────────────────────────────────────────────────────────

function lintTool(tool: ToolSchema): LintIssue[] {
  const issues: LintIssue[] = [];
  const t = (rule: string, severity: Severity, message: string): LintIssue => ({
    target: tool.name,
    category: "tool",
    severity,
    rule,
    message,
  });

  // Description checks
  if (!tool.description || tool.description.trim().length === 0) {
    issues.push(t("tool-no-description", "error", "Missing tool description. LLMs rely on this to select the right tool."));
  } else {
    const desc = tool.description.trim();
    if (desc.length < 10) {
      issues.push(t("tool-short-description", "warning", `Description is only ${desc.length} chars. Add more detail so models understand when to use this tool.`));
    }
    if (desc.length > 500) {
      issues.push(t("tool-long-description", "warning", `Description is ${desc.length} chars — consider trimming to reduce token cost. Aim for under 300 chars.`));
    }
    // Check if description is just the tool name repeated
    if (desc.toLowerCase().replace(/[_-]/g, " ") === tool.name.toLowerCase().replace(/[_-]/g, " ")) {
      issues.push(t("tool-description-is-name", "warning", "Description just repeats the tool name. Add a meaningful explanation."));
    }
  }

  // Schema checks
  const schema = tool.inputSchema;
  if (!schema || typeof schema !== "object") {
    issues.push(t("tool-no-schema", "warning", "Missing inputSchema. Clients won't know what arguments to send."));
  } else {
    const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
    const required = schema.required as string[] | undefined;

    if (schema.type !== "object") {
      issues.push(t("tool-schema-not-object", "info", `inputSchema type is "${String(schema.type)}" instead of "object". Most clients expect an object at the top level.`));
    }

    if (properties && typeof properties === "object") {
      const propNames = Object.keys(properties);

      // Check each property
      for (const propName of propNames) {
        const prop = properties[propName];
        if (!prop) continue;

        if (!prop.description || (typeof prop.description === "string" && prop.description.trim().length === 0)) {
          issues.push(t("prop-no-description", "warning", `Property "${propName}" has no description. Models perform better with described parameters.`));
        }

        if (!prop.type && !prop.enum && !prop.oneOf && !prop.anyOf && !prop.allOf && !prop.$ref) {
          issues.push(t("prop-no-type", "warning", `Property "${propName}" has no type defined. Add a type (string, number, boolean, etc.).`));
        }
      }

      // Check for required array
      if (propNames.length > 0 && (!required || !Array.isArray(required) || required.length === 0)) {
        issues.push(t("tool-no-required", "info", "No required properties defined. Consider marking essential parameters as required."));
      }

      // Check for properties listed in required but not in properties
      if (required && Array.isArray(required)) {
        for (const req of required) {
          if (!propNames.includes(req)) {
            issues.push(t("required-not-in-properties", "error", `"${req}" is listed as required but doesn't exist in properties.`));
          }
        }
      }
    } else if (schema.type === "object") {
      // Object type but no properties — likely accepts no arguments, which is fine
      // but worth noting
      issues.push(t("tool-empty-schema", "info", "Tool accepts no arguments (empty schema). If it should accept inputs, add properties."));
    }
  }

  // Name convention check
  if (!/^[a-z][a-z0-9_-]*$/i.test(tool.name)) {
    issues.push(t("tool-name-convention", "info", "Tool name contains unusual characters. Prefer snake_case or kebab-case for compatibility."));
  }

  return issues;
}

function lintResource(resource: ResourceInfo): LintIssue[] {
  const issues: LintIssue[] = [];
  const target = resource.name ?? resource.uri;
  const r = (rule: string, severity: Severity, message: string): LintIssue => ({
    target,
    category: "resource",
    severity,
    rule,
    message,
  });

  if (!resource.name) {
    issues.push(r("resource-no-name", "warning", "Missing resource name. A descriptive name helps users understand what this resource provides."));
  }

  if (!resource.description || resource.description.trim().length === 0) {
    issues.push(r("resource-no-description", "warning", "Missing resource description."));
  }

  if (!resource.mimeType) {
    issues.push(r("resource-no-mimetype", "info", "No MIME type specified. Adding one helps clients render content correctly."));
  }

  return issues;
}

function lintPrompt(prompt: PromptInfo): LintIssue[] {
  const issues: LintIssue[] = [];
  const p = (rule: string, severity: Severity, message: string): LintIssue => ({
    target: prompt.name,
    category: "prompt",
    severity,
    rule,
    message,
  });

  if (!prompt.description || prompt.description.trim().length === 0) {
    issues.push(p("prompt-no-description", "error", "Missing prompt description. Users won't know what this prompt does."));
  }

  if (prompt.arguments && prompt.arguments.length > 0) {
    for (const arg of prompt.arguments) {
      if (!arg.description || arg.description.trim().length === 0) {
        issues.push(p("prompt-arg-no-description", "warning", `Argument "${arg.name}" has no description.`));
      }
    }
  }

  return issues;
}

function lintServer(result: InspectResult): LintIssue[] {
  const issues: LintIssue[] = [];
  const s = (rule: string, severity: Severity, message: string): LintIssue => ({
    target: result.serverInfo.name,
    category: "server",
    severity,
    rule,
    message,
  });

  if (result.tools.length === 0 && result.resources.length === 0 && result.prompts.length === 0) {
    issues.push(s("server-empty", "error", "Server exposes no tools, resources, or prompts. Nothing for clients to use."));
  }

  if (!result.serverInfo.name || result.serverInfo.name === "Unknown Server") {
    issues.push(s("server-no-name", "warning", "Server didn't provide a name in its initialize response."));
  }

  if (!result.serverInfo.version || result.serverInfo.version === "unknown") {
    issues.push(s("server-no-version", "warning", "Server didn't provide a version. Versioning helps clients track compatibility."));
  }

  // Check for duplicate tool names
  const toolNames = result.tools.map((t) => t.name);
  const dupes = toolNames.filter((name, i) => toolNames.indexOf(name) !== i);
  if (dupes.length > 0) {
    issues.push(s("server-duplicate-tools", "error", `Duplicate tool names: ${[...new Set(dupes)].join(", ")}. Each tool must have a unique name.`));
  }

  return issues;
}

// ── Scoring ────────────────────────────────────────────────────────────────

function computeScore(issues: LintIssue[], result: InspectResult): number {
  const totalItems = result.tools.length + result.resources.length + result.prompts.length;
  if (totalItems === 0) return 0;

  // Start at 100, deduct per issue
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case "error":
        score -= 15;
        break;
      case "warning":
        score -= 5;
        break;
      case "info":
        score -= 1;
        break;
    }
  }

  // Bonus: well-described tools (all tools have descriptions > 20 chars)
  const wellDescribed = result.tools.every(
    (t) => t.description && t.description.trim().length >= 20,
  );
  if (wellDescribed && result.tools.length > 0) {
    score = Math.min(100, score + 5);
  }

  return Math.max(0, Math.min(100, score));
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

// ── Main linter ────────────────────────────────────────────────────────────

export function lintMcpServer(result: InspectResult): LintReport {
  const issues: LintIssue[] = [];

  // Lint server-level
  issues.push(...lintServer(result));

  // Lint each tool
  for (const tool of result.tools) {
    issues.push(...lintTool(tool));
  }

  // Lint each resource
  for (const resource of result.resources) {
    issues.push(...lintResource(resource));
  }

  // Lint each prompt
  for (const prompt of result.prompts) {
    issues.push(...lintPrompt(prompt));
  }

  // Token estimate
  const perTool = result.tools.map((tool) => ({
    name: tool.name,
    tokens: estimateToolTokens(tool),
  }));
  const totalTokens = perTool.reduce((sum, t) => sum + t.tokens, 0);

  // Score & grade
  const score = computeScore(issues, result);
  const grade = scoreToGrade(score);

  // If grade is F but no errors exist, the F came purely from accumulated warnings.
  // Surface it as an error so the issues list always explains an F grade,
  // and so CI tools gating on errors correctly catch it.
  const errorCount = issues.filter((i) => i.severity === "error").length;
  if (grade === "F" && errorCount === 0) {
    issues.push({
      target: result.serverInfo.name,
      category: "server",
      severity: "error",
      rule: "server-grade-f",
      message: `Server received grade F (score ${score}/100) from accumulated warnings. Fix warnings above to improve quality.`,
    });
  }

  return {
    grade,
    score,
    issues,
    tokenEstimate: {
      total: totalTokens,
      perTool,
    },
    summary: {
      errors: issues.filter((i) => i.severity === "error").length,
      warnings: issues.filter((i) => i.severity === "warning").length,
      infos: issues.filter((i) => i.severity === "info").length,
      toolsChecked: result.tools.length,
      resourcesChecked: result.resources.length,
      promptsChecked: result.prompts.length,
    },
  };
}
