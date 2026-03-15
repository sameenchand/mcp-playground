"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={
        className ??
        "shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      }
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
