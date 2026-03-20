export default function QualityLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="h-8 w-72 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-5 w-[32rem] max-w-full bg-muted/30 rounded-lg animate-pulse mt-2" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 p-4 space-y-2"
          >
            <div className="h-4 w-20 bg-muted/40 rounded animate-pulse" />
            <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Grade distribution skeleton */}
      <div className="rounded-xl border border-border/40 p-6 mb-8">
        <div className="h-5 w-40 bg-muted/40 rounded animate-pulse mb-4" />
        <div className="h-10 w-full bg-muted/20 rounded-lg animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <div className="h-12 bg-muted/20 border-b border-border/30" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-border/20 flex items-center gap-4 px-4"
          >
            <div className="h-4 w-8 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted/30 rounded animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
