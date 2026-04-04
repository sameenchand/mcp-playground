import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { LintClient } from "@/components/linter/lint-client";
import { Loader2 } from "lucide-react";

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
          estimate the token cost of your tool definitions.{" "}
          <Link
            href="/docs/grading"
            className="text-primary hover:underline underline-offset-4"
          >
            How are grades calculated? →
          </Link>{" "}
          Want to run linting in CI?{" "}
          <Link
            href="/docs/ci"
            className="text-primary hover:underline underline-offset-4"
          >
            See the CLI & CI docs →
          </Link>
        </p>
      </div>
      <Suspense fallback={
        <div className="flex items-center gap-2 text-muted-foreground text-sm p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      }>
        <LintClient />
      </Suspense>
    </div>
  );
}
