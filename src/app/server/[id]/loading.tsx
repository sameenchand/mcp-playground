import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ServerLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <Skeleton className="h-5 w-32 mb-8" />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-5 w-full max-w-lg" />
          <Skeleton className="h-5 w-3/4 max-w-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>

      <Separator className="mb-8" />

      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border/50 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-2/3 ml-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
