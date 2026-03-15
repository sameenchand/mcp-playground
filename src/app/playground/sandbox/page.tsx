"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { WebContainerPlayground } from "@/components/playground/webcontainer-playground";
import { SandboxLanding } from "@/components/playground/sandbox-landing";

function SandboxContent() {
  const searchParams = useSearchParams();
  const packageName = searchParams.get("package");
  const version = searchParams.get("version") ?? undefined;
  const tool = searchParams.get("tool") ?? undefined;

  if (!packageName) {
    return <SandboxLanding />;
  }

  return (
    <WebContainerPlayground
      packageName={packageName}
      version={version}
      initialTool={tool}
    />
  );
}

export default function SandboxPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <SandboxContent />
      </Suspense>
    </div>
  );
}
