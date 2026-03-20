"use client";

const GRADE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  A: { bg: "bg-green-500/10", text: "text-green-500", bar: "bg-green-500" },
  B: { bg: "bg-blue-500/10", text: "text-blue-500", bar: "bg-blue-500" },
  C: { bg: "bg-yellow-500/10", text: "text-yellow-500", bar: "bg-yellow-500" },
  D: { bg: "bg-orange-500/10", text: "text-orange-500", bar: "bg-orange-500" },
  F: { bg: "bg-red-500/10", text: "text-red-500", bar: "bg-red-500" },
};

const GRADE_LABELS: Record<string, string> = {
  A: "Excellent",
  B: "Good",
  C: "Needs Work",
  D: "Poor",
  F: "Critical",
};

interface GradeDistributionProps {
  gradeCounts: Record<string, number>;
  total: number;
  activeGrade: string | null;
  onGradeClick: (grade: string) => void;
}

export function GradeDistribution({
  gradeCounts,
  total,
  activeGrade,
  onGradeClick,
}: GradeDistributionProps) {
  const grades = ["A", "B", "C", "D", "F"];

  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Grade Distribution
      </h3>

      {/* Segmented bar */}
      <div className="h-8 w-full rounded-lg overflow-hidden flex mb-6">
        {grades.map((grade) => {
          const count = gradeCounts[grade] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          const colors = GRADE_COLORS[grade]!;
          const isActive = activeGrade === grade;
          return (
            <button
              key={grade}
              onClick={() => onGradeClick(grade)}
              className={`${colors.bar} flex items-center justify-center text-white text-xs font-bold transition-all hover:opacity-80 ${isActive ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
              style={{ width: `${pct}%`, minWidth: pct > 0 ? "24px" : 0 }}
              title={`Grade ${grade}: ${count} servers (${Math.round(pct)}%)`}
            >
              {pct >= 5 ? grade : ""}
            </button>
          );
        })}
      </div>

      {/* Grade cards */}
      <div className="grid grid-cols-5 gap-3">
        {grades.map((grade) => {
          const count = gradeCounts[grade] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const colors = GRADE_COLORS[grade]!;
          const isActive = activeGrade === grade;
          return (
            <button
              key={grade}
              onClick={() => onGradeClick(grade)}
              className={`rounded-lg border p-3 text-center transition-all ${
                isActive
                  ? `${colors.bg} border-current ${colors.text}`
                  : "border-border/40 hover:border-border"
              }`}
            >
              <p className={`text-2xl font-bold ${isActive ? colors.text : "text-foreground"}`}>
                {grade}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {count} ({pct}%)
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {GRADE_LABELS[grade]}
              </p>
            </button>
          );
        })}
      </div>

      {activeGrade && (
        <p className="text-xs text-muted-foreground mt-3">
          Showing Grade {activeGrade} servers.{" "}
          <button
            onClick={() => onGradeClick(activeGrade)}
            className="text-primary hover:underline"
          >
            Clear filter
          </button>
        </p>
      )}
    </div>
  );
}
