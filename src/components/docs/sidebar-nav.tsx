"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
      { href: "/docs/grading", label: "Grading Methodology" },
      { href: "/docs/ci", label: "CLI & CI Integration" },
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

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-20 space-y-6">
      <div>
        <Link
          href="/docs"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          Documentation
        </Link>
      </div>
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.links.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
