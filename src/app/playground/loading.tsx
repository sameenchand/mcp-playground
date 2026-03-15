import { Loader2 } from "lucide-react";

export default function PlaygroundLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">Loading playground…</p>
    </div>
  );
}
