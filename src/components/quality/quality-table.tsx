"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, ExternalLink } from "lucide-react";
import type { ScanResult } from "@/lib/quality-scanner";

// ── Grade badge (inline) ───────────────────────────────────────────────────

const GRADE_BG: Record<string, string> = {
  A: "bg-green-500/15 text-green-600 dark:text-green-400",
  B: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  C: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  D: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  F: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function GradePill({ grade }: { grade: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${GRADE_BG[grade] ?? GRADE_BG.F}`}
    >
      {grade}
    </span>
  );
}

// ── Sortable columns ───────────────────────────────────────────────────────

type SortKey = "name" | "grade" | "score" | "toolCount" | "connectionTimeMs";
type SortDir = "asc" | "desc";

const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };

function compareResults(a: ScanResult, b: ScanResult, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  switch (key) {
    case "name":
      cmp = a.name.localeCompare(b.name);
      break;
    case "grade":
      cmp = (GRADE_ORDER[a.grade] ?? 5) - (GRADE_ORDER[b.grade] ?? 5);
      break;
    case "score":
      cmp = a.score - b.score;
      break;
    case "toolCount":
      cmp = a.toolCount - b.toolCount;
      break;
    case "connectionTimeMs":
      cmp = a.connectionTimeMs - b.connectionTimeMs;
      break;
  }
  return dir === "desc" ? -cmp : cmp;
}

// ── Component ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

interface QualityTableProps {
  results: ScanResult[];
  gradeFilter: string | null;
}

export function QualityTable({ results, gradeFilter }: QualityTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let items = results;

    // Grade filter
    if (gradeFilter) {
      items = items.filter((r) => r.grade === gradeFilter);
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q),
      );
    }

    // Sort
    items = [...items].sort((a, b) => compareResults(a, b, sortKey, sortDir));

    return items;
  }, [results, gradeFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${sortKey === field ? "text-foreground" : "text-muted-foreground/40"}`}
      />
    </button>
  );

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-border/30">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search servers..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {filtered.length} server{filtered.length !== 1 ? "s" : ""}
          {gradeFilter ? ` (Grade ${gradeFilter})` : ""}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 bg-muted/10">
              <th className="text-left px-4 py-3 w-8">#</th>
              <th className="text-left px-4 py-3">
                <SortHeader label="Server" field="name" />
              </th>
              <th className="text-center px-4 py-3 w-20">
                <SortHeader label="Grade" field="grade" />
              </th>
              <th className="text-right px-4 py-3 w-20">
                <SortHeader label="Score" field="score" />
              </th>
              <th className="text-right px-4 py-3 w-20 hidden sm:table-cell">
                <SortHeader label="Tools" field="toolCount" />
              </th>
              <th className="text-center px-4 py-3 w-24 hidden md:table-cell">
                Transport
              </th>
              <th className="text-right px-4 py-3 w-24 hidden lg:table-cell">
                <SortHeader label="Time" field="connectionTimeMs" />
              </th>
              <th className="text-right px-4 py-3 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((result, i) => {
              const rank = page * PAGE_SIZE + i + 1;
              const hasError = !!result.error;

              return (
                <tr
                  key={result.url}
                  className="border-b border-border/20 hover:bg-muted/5 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground/60 tabular-nums">
                    {rank}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground truncate max-w-[300px]">
                      {result.name}
                    </p>
                    {hasError && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {result.error}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasError ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <GradePill grade={result.grade} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {hasError ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="text-foreground font-medium">
                        {result.score}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                    {result.toolCount}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {result.transport === "unknown" ? "—" : result.transport}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">
                    {result.connectionTimeMs > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {result.connectionTimeMs}ms
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!hasError && (
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/lint?url=${encodeURIComponent(result.url)}`}
                          className="inline-flex items-center px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          title="View full lint report"
                        >
                          Lint
                        </Link>
                        <Link
                          href={`/playground?url=${encodeURIComponent(result.url)}`}
                          className="inline-flex items-center px-2 py-1 rounded text-xs text-primary hover:bg-primary/10 transition-colors"
                          title="Test in playground"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Test
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
