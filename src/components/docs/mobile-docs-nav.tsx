"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, BookOpen } from "lucide-react";

const sections = [
  {
    title: "Getting Started",
    links: [
      { href: "/docs/getting-started", label: "Introduction" },
      { href: "/docs/connecting-servers", label: "Connecting Servers" },
    ],
  },
  {
    title: "Features",
    links: [
      { href: "/docs/sandbox", label: "In-Browser Sandbox" },
      { href: "/docs/embedding", label: "Embedding" },
      { href: "/docs/local-servers", label: "Local Servers" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/lint", label: "Schema Linter" },
      { href: "/quality", label: "Quality Dashboard" },
    ],
  },
  {
    title: "Reference",
    links: [
      { href: "/docs/api", label: "Public API" },
      { href: "/docs/faq", label: "FAQ" },
    ],
  },
];

const allLinks = sections.flatMap((s) => s.links);

export function MobileDocsNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = allLinks.find(
    (l) => pathname === l.href || pathname.startsWith(l.href + "/"),
  );

  return (
    <div className="lg:hidden mb-6">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-border/50 bg-card text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          {current?.label ?? "Documentation"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-border/50 bg-card overflow-hidden">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {section.title}
              </p>
              {section.links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
          <div className="h-2" />
        </div>
      )}
    </div>
  );
}
