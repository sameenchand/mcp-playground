import Link from "next/link";

export const metadata = {
  title: "Grading Methodology — MCP Playground Docs",
  description:
    "How MCP Playground grades server quality. Every lint rule explained, the scoring formula, grade thresholds, and tips to improve your score.",
};

function RuleRow({
  id,
  severity,
  what,
  why,
}: {
  id: string;
  severity: "error" | "warning" | "info";
  what: string;
  why: string;
}) {
  const badge =
    severity === "error"
      ? "bg-red-500/10 text-red-500 border-red-500/20"
      : severity === "warning"
        ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
        : "bg-blue-500/10 text-blue-500 border-blue-500/20";

  const points =
    severity === "error" ? "−15 pts" : severity === "warning" ? "−5 pts" : "−1 pt";

  return (
    <tr className="border-b border-border/20 hover:bg-muted/5 transition-colors">
      <td className="px-4 py-3 align-top">
        <code className="text-xs font-mono text-muted-foreground">{id}</code>
      </td>
      <td className="px-4 py-3 align-top">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge}`}
        >
          {severity}
        </span>
      </td>
      <td className="px-4 py-3 align-top text-xs text-muted-foreground font-mono">
        {points}
      </td>
      <td className="px-4 py-3 align-top">
        <p className="text-sm text-foreground font-medium">{what}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{why}</p>
      </td>
    </tr>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-foreground mt-8 mb-1 flex items-center gap-2">
      {children}
    </h3>
  );
}

export default function GradingPage() {
  return (
    <article className="max-w-none">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Reference
        </p>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Grading Methodology
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every grade on MCP Playground is computed from a fixed set of rules applied
          to the server&apos;s live response. This page documents every rule, the scoring
          formula, and grade thresholds — so you know exactly what to fix.
        </p>
      </div>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">How It Works</h2>
        <ol className="space-y-3 text-sm text-muted-foreground list-none">
          {[
            ["Connect", "We open a live connection to the server using the MCP SDK and call initialize, tools/list, resources/list, and prompts/list."],
            ["Lint", "Each tool, resource, prompt, and the server itself is checked against the rules below. Each violation is recorded with a severity."],
            ["Score", "We start at 100 and deduct points per violation. A bonus of +5 is added if every tool has a description of at least 20 characters."],
            ["Grade", "The numeric score is mapped to a letter grade using fixed thresholds."],
          ].map(([step, desc], i) => (
            <li key={step} className="flex gap-4">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span>
                <strong className="text-foreground">{step}</strong> — {desc}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Scoring formula */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">Scoring Formula</h2>
        <div className="rounded-lg bg-muted/20 border border-border/50 p-4 font-mono text-sm space-y-1 text-foreground">
          <p>score = 100</p>
          <p className="text-red-500">score −= 15 × (number of errors)</p>
          <p className="text-yellow-600 dark:text-yellow-400">score −= 5 × (number of warnings)</p>
          <p className="text-blue-500">score −= 1 × (number of infos)</p>
          <p className="text-green-500">score += 5 if all tools have descriptions ≥ 20 chars</p>
          <p className="text-muted-foreground">score = clamp(score, 0, 100)</p>
          <p className="text-muted-foreground">score = 0 if server has no tools, resources, or prompts</p>
        </div>
      </section>

      {/* Grade thresholds */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">Grade Thresholds</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { grade: "A", range: "90 – 100", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", label: "Excellent" },
            { grade: "B", range: "75 – 89", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", label: "Good" },
            { grade: "C", range: "60 – 74", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20", label: "Needs Work" },
            { grade: "D", range: "40 – 59", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", label: "Poor" },
            { grade: "F", range: "0 – 39", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", label: "Critical" },
          ].map(({ grade, range, color, label }) => (
            <div
              key={grade}
              className={`rounded-xl border p-4 text-center ${color}`}
            >
              <p className="text-3xl font-bold">{grade}</p>
              <p className="text-xs font-medium mt-1">{label}</p>
              <p className="text-xs opacity-70 mt-0.5">{range}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rules table */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-2">All Lint Rules</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Rules are applied per-item (each tool, resource, or prompt is checked independently) plus once at the server level.
        </p>

        {/* Tool rules */}
        <SectionHeading>🔧 Tool Rules</SectionHeading>
        <p className="text-xs text-muted-foreground mb-3">
          Applied once per tool. Tools are the most important capability — LLMs rely on descriptions to decide which tool to call.
        </p>
        <div className="rounded-xl border border-border/40 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-52">Rule ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-24">Severity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-20">Points</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">What &amp; Why</th>
                </tr>
              </thead>
              <tbody>
                <RuleRow
                  id="tool-no-description"
                  severity="error"
                  what="Missing tool description"
                  why="LLMs pick the right tool based on its description. Without one, the tool is effectively unusable by an AI agent."
                />
                <RuleRow
                  id="tool-short-description"
                  severity="warning"
                  what="Description is under 10 characters"
                  why="A very short description gives models almost no signal. Add context about when and why to use this tool."
                />
                <RuleRow
                  id="tool-long-description"
                  severity="warning"
                  what="Description exceeds 500 characters"
                  why="Overly long descriptions increase token cost for every call. Aim for under 300 characters."
                />
                <RuleRow
                  id="tool-description-is-name"
                  severity="warning"
                  what="Description just repeats the tool name"
                  why="This adds no information. Replace it with a meaningful explanation of what the tool does."
                />
                <RuleRow
                  id="tool-no-schema"
                  severity="warning"
                  what="Missing inputSchema"
                  why="Without a schema, clients don't know what arguments to send and can't generate a form."
                />
                <RuleRow
                  id="tool-schema-not-object"
                  severity="info"
                  what="inputSchema type is not 'object'"
                  why="The MCP spec expects an object schema at the top level. Most clients will work, but this is non-standard."
                />
                <RuleRow
                  id="prop-no-description"
                  severity="warning"
                  what="A parameter has no description"
                  why="Models and users need descriptions to understand what each parameter does. Applied per parameter."
                />
                <RuleRow
                  id="prop-no-type"
                  severity="warning"
                  what="A parameter has no type"
                  why="Without a type, clients can't validate input or generate the right form field. Applied per parameter."
                />
                <RuleRow
                  id="tool-no-required"
                  severity="info"
                  what="No required parameters defined"
                  why="If the tool has parameters, consider marking the essential ones as required so clients know what's mandatory."
                />
                <RuleRow
                  id="required-not-in-properties"
                  severity="error"
                  what="A required field is missing from properties"
                  why="The schema lists a field as required that doesn't exist in properties — this is a schema bug."
                />
                <RuleRow
                  id="tool-empty-schema"
                  severity="info"
                  what="Tool accepts no arguments"
                  why="Noted for visibility. If this tool should take inputs, add a properties object to the schema."
                />
                <RuleRow
                  id="tool-name-convention"
                  severity="info"
                  what="Tool name uses unusual characters"
                  why="Some clients have trouble with names that aren't snake_case or kebab-case."
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Resource rules */}
        <SectionHeading>📄 Resource Rules</SectionHeading>
        <p className="text-xs text-muted-foreground mb-3">Applied once per resource.</p>
        <div className="rounded-xl border border-border/40 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-52">Rule ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-24">Severity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-20">Points</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">What &amp; Why</th>
                </tr>
              </thead>
              <tbody>
                <RuleRow
                  id="resource-no-name"
                  severity="warning"
                  what="Missing resource name"
                  why="A descriptive name helps users and clients understand what this resource provides."
                />
                <RuleRow
                  id="resource-no-description"
                  severity="warning"
                  what="Missing resource description"
                  why="Without a description, clients can't explain to users what this resource contains."
                />
                <RuleRow
                  id="resource-no-mimetype"
                  severity="info"
                  what="No MIME type specified"
                  why="A MIME type (e.g. text/plain, application/json) lets clients render content correctly."
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Prompt rules */}
        <SectionHeading>💬 Prompt Rules</SectionHeading>
        <p className="text-xs text-muted-foreground mb-3">Applied once per prompt.</p>
        <div className="rounded-xl border border-border/40 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-52">Rule ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-24">Severity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-20">Points</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">What &amp; Why</th>
                </tr>
              </thead>
              <tbody>
                <RuleRow
                  id="prompt-no-description"
                  severity="error"
                  what="Missing prompt description"
                  why="Users need to know what a prompt does before they run it. This is a critical metadata gap."
                />
                <RuleRow
                  id="prompt-arg-no-description"
                  severity="warning"
                  what="A prompt argument has no description"
                  why="Argument descriptions help users fill in the right values. Applied per argument."
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Server rules */}
        <SectionHeading>🖥️ Server Rules</SectionHeading>
        <p className="text-xs text-muted-foreground mb-3">Applied once at the server level, regardless of tool/resource/prompt count.</p>
        <div className="rounded-xl border border-border/40 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-52">Rule ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-24">Severity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-20">Points</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">What &amp; Why</th>
                </tr>
              </thead>
              <tbody>
                <RuleRow
                  id="server-empty"
                  severity="error"
                  what="Server exposes no tools, resources, or prompts"
                  why="An empty server has nothing for clients to use. Score is automatically 0."
                />
                <RuleRow
                  id="server-no-name"
                  severity="warning"
                  what="No server name in initialize response"
                  why="The server name identifies it to clients and shows up in logs and UIs."
                />
                <RuleRow
                  id="server-no-version"
                  severity="warning"
                  what="No version in initialize response"
                  why="Versioning helps clients track compatibility and detect breaking changes."
                />
                <RuleRow
                  id="server-duplicate-tools"
                  severity="error"
                  what="Duplicate tool names"
                  why="Having two tools with the same name is a schema bug — only one can be called."
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">Tips for a Better Grade</h2>
        <div className="space-y-3">
          {[
            {
              grade: "F → D",
              tip: "Fix any server-level errors first: make sure the server responds, returns a name and version, and exposes at least one tool.",
            },
            {
              grade: "D → C",
              tip: "Add descriptions to all tools. Even a single sentence is enough to clear the most impactful error rule.",
            },
            {
              grade: "C → B",
              tip: "Add descriptions to each tool parameter. This clears the prop-no-description warnings which cost 5 points each.",
            },
            {
              grade: "B → A",
              tip: "Add types to all parameters, keep descriptions under 300 characters, and make sure all tools have descriptions ≥ 20 characters to earn the +5 bonus.",
            },
          ].map(({ grade, tip }) => (
            <div key={grade} className="flex gap-4 rounded-lg border border-border/40 p-4">
              <span className="shrink-0 text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-1 rounded self-start">
                {grade}
              </span>
              <p className="text-sm text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer links */}
      <div className="rounded-lg bg-muted/20 border border-border/40 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Check your server</p>
        <p className="mb-3">
          Run the linter on any live MCP server at{" "}
          <Link href="/lint" className="text-primary hover:underline underline-offset-4">
            /lint
          </Link>
          , or see how your server ranks in the{" "}
          <Link href="/quality" className="text-primary hover:underline underline-offset-4">
            Quality Dashboard
          </Link>
          .
        </p>
        <p className="text-xs text-muted-foreground/60">
          The grading logic is open source.{" "}
          <a
            href="https://github.com/sameenchand/mcp-playground/blob/main/src/lib/schema-linter.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-4"
          >
            View schema-linter.ts on GitHub →
          </a>
        </p>
      </div>
    </article>
  );
}
