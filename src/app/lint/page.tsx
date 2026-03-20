import { Metadata } from "next";
import { LintClient } from "@/components/linter/lint-client";

export const metadata: Metadata = {
  title: "Schema Linter — MCP Playground",
  description:
    "Grade your MCP server's quality. Check tool descriptions, JSON Schema completeness, token cost, and get actionable improvement suggestions.",
};

export default function LintPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Schema Linter
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Paste your MCP server URL and get a quality report. We&apos;ll check
          tool descriptions, JSON Schema completeness, resource metadata, and
          estimate the token cost of your tool definitions.
        </p>
      </div>
      <LintClient />
    </div>
  );
}
