"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Download, Loader2, RefreshCw } from "lucide-react";
import { GradeDistribution } from "@/components/quality/grade-distribution";
import { QualityTable } from "@/components/quality/quality-table";
import type { ScanResult } from "@/lib/quality-scanner";

// ── Types ──────────────────────────────────────────────────────────────────

interface ServerEntry {
  id: string;
  name: string;
  url: string;
}

interface CachedData {
  results: ScanResult[];
  scannedUrls: string[];
  scanIndex: number;
  timestamp: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const CACHE_KEY = "mcp-quality-scan";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 500;
const SAVE_INTERVAL = 10; // Save to localStorage every N servers

// ── Helpers ────────────────────────────────────────────────────────────────

function loadCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CachedData = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveCache(results: ScanResult[], scannedUrls: string[], scanIndex: number) {
  try {
    const data: CachedData = { results, scannedUrls, scanIndex, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function exportCsv(results: ScanResult[]) {
  const headers = [
    "Name",
    "URL",
    "Grade",
    "Score",
    "Tools",
    "Resources",
    "Prompts",
    "Issues",
    "Transport",
    "Response Time (ms)",
    "Error",
  ];
  const rows = results.map((r) => [
    r.name,
    r.url,
    r.grade,
    r.score,
    r.toolCount,
    r.resourceCount,
    r.promptCount,
    r.issueCount,
    r.transport,
    r.connectionTimeMs,
    r.error ?? "",
  ]);
  const csv = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mcp-quality-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────

export function QualityDashboard({ servers }: { servers: ServerEntry[] }) {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scannedUrls, setScannedUrls] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "reachable" | "auth-required" | "failed">("all");
  const abortRef = useRef(false);
  const scanIndexRef = useRef(0);

  // Load cache on mount
  useEffect(() => {
    const cached = loadCache();
    if (cached && cached.results.length > 0) {
      setResults(cached.results);
      setScannedUrls(new Set(cached.scannedUrls));
      scanIndexRef.current = cached.scanIndex ?? 0;
    }
    setLoaded(true);
  }, []);

  const totalServers = servers.length;
  const scannedCount = scannedUrls.size;
  const isComplete = scannedCount >= totalServers;

  // Scan loop
  const startScanning = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    abortRef.current = false;

    let idx = scanIndexRef.current;
    // If the scan ran to the end but missed servers (network failures),
    // restart from 0 — the scanned-URL filter skips already-done servers instantly
    if (idx >= servers.length) {
      idx = 0;
      scanIndexRef.current = 0;
    }
    let currentResults = [...results];
    let currentScanned = new Set(scannedUrls);

    while (idx < servers.length && !abortRef.current) {
      const batch = servers
        .slice(idx, idx + BATCH_SIZE)
        .filter((s) => !currentScanned.has(s.url));

      if (batch.length === 0) {
        idx += BATCH_SIZE;
        scanIndexRef.current = idx;
        continue;
      }

      try {
        const res = await fetch("/api/mcp/scan-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: batch.map((s) => s.url) }),
        });

        if (!res.ok) {
          // Rate limited — wait and retry
          if (res.status === 429) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          // Other error — skip batch
          idx += BATCH_SIZE;
          scanIndexRef.current = idx;
          continue;
        }

        const data: { results: ScanResult[] } = await res.json();

        // Merge results — use registry name if server returned "Unknown"
        const merged = data.results.map((r) => {
          const match = batch.find((s) => s.url === r.url);
          return {
            ...r,
            name: r.name === "Unknown" && match ? match.name : r.name,
          };
        });

        currentResults = [...currentResults, ...merged];
        for (const r of merged) currentScanned.add(r.url);

        setResults(currentResults);
        setScannedUrls(new Set(currentScanned));
      } catch {
        // Network error — skip batch
      }

      idx += BATCH_SIZE;
      scanIndexRef.current = idx;

      // Partial save
      if (currentResults.length % SAVE_INTERVAL < BATCH_SIZE) {
        saveCache(currentResults, Array.from(currentScanned), scanIndexRef.current);
      }

      // Delay between batches
      if (!abortRef.current) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    // Final save
    saveCache(currentResults, Array.from(currentScanned), scanIndexRef.current);
    setScanning(false);
  }, [scanning, servers, results, scannedUrls]);

  const pauseScanning = useCallback(() => {
    abortRef.current = true;
  }, []);

  const resetScan = useCallback(() => {
    abortRef.current = true;
    setResults([]);
    setScannedUrls(new Set());
    scanIndexRef.current = 0;
    localStorage.removeItem(CACHE_KEY);
    setScanning(false);
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────

  const successResults = results.filter((r) => !r.error);
  const failedResults = results.filter((r) => r.error);
  const authRequiredCount = failedResults.filter((r) =>
    r.error?.toLowerCase().includes("auth"),
  ).length;
  const unreachableCount = failedResults.length - authRequiredCount;
  const avgScore =
    successResults.length > 0
      ? Math.round(
          successResults.reduce((sum, r) => sum + r.score, 0) /
            successResults.length,
        )
      : 0;

  const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of successResults) {
    gradeCounts[r.grade] = (gradeCounts[r.grade] ?? 0) + 1;
  }

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {!scanning && !isComplete && (
          <button
            onClick={startScanning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Play className="h-4 w-4" />
            {scannedCount > 0 ? "Resume Scan" : "Start Scan"}
          </button>
        )}
        {!scanning && isComplete && (
          <button
            onClick={resetScan}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Re-scan All
          </button>
        )}
        {scanning && (
          <button
            onClick={pauseScanning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            <Pause className="h-4 w-4" />
            Pause
          </button>
        )}
        {scannedCount > 0 && !scanning && (
          <>
            <button
              onClick={resetScan}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={() => exportCsv(results)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </>
        )}
        {scanning && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning...
          </span>
        )}
      </div>

      {/* Progress bar */}
      {(scanning || scannedCount > 0) && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {scannedCount} / {totalServers} servers scanned
            </span>
            <span>
              {totalServers > 0
                ? Math.round((scannedCount / totalServers) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${totalServers > 0 ? (scannedCount / totalServers) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Summary stats */}
      {scannedCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Scanned" value={scannedCount.toString()} />
          <StatCard
            label="Avg Score"
            value={`${avgScore}/100`}
          />
          <StatCard
            label="Reachable"
            value={successResults.length.toString()}
            sub={`${authRequiredCount} auth · ${unreachableCount} unreachable`}
          />
          <StatCard
            label="Top Grade"
            value={`${gradeCounts.A} servers`}
            sub="Grade A"
          />
        </div>
      )}

      {/* Grade distribution */}
      {successResults.length > 0 && (
        <GradeDistribution
          gradeCounts={gradeCounts}
          total={successResults.length}
          activeGrade={gradeFilter}
          onGradeClick={(grade) =>
            setGradeFilter(gradeFilter === grade ? null : grade)
          }
        />
      )}

      {/* Results table */}
      {results.length > 0 && (
        <QualityTable
          results={results}
          gradeFilter={gradeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {/* Empty state */}
      {scannedCount === 0 && !scanning && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-lg font-medium mb-1">
            Ready to scan {totalServers} servers
          </p>
          <p className="text-muted-foreground/60 text-sm max-w-md">
            Click &quot;Start Scan&quot; to inspect every live MCP server in the
            registry and grade them A–F. Results are cached locally for 24 hours.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && (
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      )}
    </div>
  );
}
