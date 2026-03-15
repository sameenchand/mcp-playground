import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  ArrowLeft,
  Zap,
  Globe,
  Lock,
  Package,
  Terminal,
  Wifi,
  AlertCircle,
} from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/ui/copy-button";
import { ServerHealth } from "@/components/registry/server-health";
import { fetchServerById } from "@/lib/registry-api";

interface ServerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ServerPageProps) {
  const { id } = await params;
  const server = await fetchServerById(decodeURIComponent(id));
  if (!server) return { title: "Server Not Found" };
  return {
    title: server.name,
    description: server.description,
  };
}

function InstallBlock({ label, command }: { label: string; command: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-4 py-2.5">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <code className="flex-1 text-sm font-mono text-foreground">{command}</code>
        <CopyButton value={command} />
      </div>
    </div>
  );
}

export default async function ServerPage({ params }: ServerPageProps) {
  const { id } = await params;
  // Next.js decodes %2F → / in params, so id is already the original name
  const server = await fetchServerById(decodeURIComponent(id));

  if (!server) notFound();

  const repoUrl = server.repository?.url;
  const hasRemote = Boolean(server.remoteUrl);
  const requiredHeaders = (server.remoteHeaders ?? []).filter((h) => h.isRequired);
  const requiresAuth = requiredHeaders.length > 0;

  const npmPackage = server.packages?.find((p) => p.registry_name === "npm");
  const pypiPackage = server.packages?.find((p) => p.registry_name === "pypi");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">{server.name}</h1>
            {server.version && (
              <Badge variant="secondary" className="font-mono text-xs">
                v{server.version}
              </Badge>
            )}
            {hasRemote ? (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                <Wifi className="h-3 w-3" />
                {requiresAuth ? "Live · Requires Auth" : "Live · No Auth"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/40">
                <Package className="h-3 w-3" />
                Local Package
              </span>
            )}
          </div>
          {server.description && (
            <p className="text-muted-foreground leading-relaxed max-w-2xl">{server.description}</p>
          )}
          {server.categories && server.categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {server.categories.map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs capitalize">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {server.websiteUrl && (
            <a
              href={server.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Website
            </a>
          )}
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Source
            </a>
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Live Endpoint section */}
      {hasRemote && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            Remote Endpoint
          </h2>

          {/* URL + live status */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-4 py-2.5 mb-4">
            <code className="flex-1 text-sm font-mono text-foreground break-all">
              {server.remoteUrl}
            </code>
            <CopyButton value={server.remoteUrl!} />
          </div>
          <div className="mb-4">
            <ServerHealth url={server.remoteUrl!} />
          </div>

          {/* Auth requirements */}
          {requiresAuth && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    This server requires authentication
                  </p>
                  {requiredHeaders.map((h) => (
                    <div key={h.name}>
                      <p className="text-xs font-mono text-foreground">
                        Header: <span className="text-primary">{h.name}</span>
                      </p>
                      {h.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{h.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Connect CTA */}
          {!requiresAuth ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/connect?url=${encodeURIComponent(server.remoteUrl!)}`}
                className={buttonVariants({ variant: "default" })}
              >
                <Zap className="h-4 w-4 mr-2" />
                Inspect Live
              </Link>
              <Link
                href={`/playground?url=${encodeURIComponent(server.remoteUrl!)}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Open in Playground
              </Link>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/20 border border-border/50">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Get your API key, then{" "}
                  <Link
                    href={`/connect?url=${encodeURIComponent(server.remoteUrl!)}&headerNames=${encodeURIComponent(JSON.stringify(requiredHeaders.map((h) => ({ name: h.name, description: h.description }))))}`}
                    className="text-primary hover:underline underline-offset-4"
                  >
                    connect with pre-filled headers
                  </Link>{" "}
                  — just paste your key values and hit Inspect.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Local Package section */}
      {(npmPackage ?? pypiPackage ?? !hasRemote) && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Local Installation
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Run this server locally and connect via its HTTP endpoint, or use it directly with Claude Desktop.
          </p>
          {/* Try in Browser — npm packages only */}
          {npmPackage?.name && (
            <div className="mb-4">
              <Link
                href={`/playground/sandbox?package=${encodeURIComponent(npmPackage.name)}${npmPackage.version ? `&version=${encodeURIComponent(npmPackage.version)}` : ""}`}
                className={buttonVariants({ variant: "default" })}
              >
                <Terminal className="h-4 w-4 mr-2" />
                Try in Browser
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Runs entirely in your browser via WebContainers — no install needed.
              </p>
            </div>
          )}
          {pypiPackage?.name && !npmPackage?.name && (
            <div className="mb-4">
              <button
                disabled
                className={buttonVariants({ variant: "outline" }) + " opacity-50 cursor-not-allowed"}
                title="In-browser execution supports Node.js packages only"
              >
                <Terminal className="h-4 w-4 mr-2" />
                Try in Browser
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                In-browser execution supports Node.js packages only. Python support coming soon.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {npmPackage?.name && (
              <InstallBlock
                label="npm / npx"
                command={`npx -y ${npmPackage.name}${npmPackage.version ? `@${npmPackage.version}` : ""}`}
              />
            )}
            {pypiPackage?.name && (
              <InstallBlock
                label="Python / uvx"
                command={`uvx ${pypiPackage.name}${pypiPackage.version ? `==${pypiPackage.version}` : ""}`}
              />
            )}
            {!npmPackage && !pypiPackage && repoUrl && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  See the{" "}
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline underline-offset-4"
                  >
                    repository
                  </a>{" "}
                  for installation instructions.
                </p>
              </div>
            )}
          </div>

          {!hasRemote && (
            <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              This server doesn&apos;t have a public remote endpoint — it must be run locally.
              Once running with HTTP transport, paste its URL into{" "}
              <Link href="/connect" className="text-primary hover:underline underline-offset-4 mx-1">
                Connect a Server
              </Link>
              to inspect it.
            </p>
          )}
        </section>
      )}

      {/* Metadata */}
      <Separator className="mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Package ID</p>
          <p className="font-mono text-xs text-foreground break-all">{server.id}</p>
        </div>
        {server.version && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Version</p>
            <p className="font-mono text-xs text-foreground">{server.version}</p>
          </div>
        )}
        {server.updated_at && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Updated</p>
            <p className="text-xs text-foreground">
              {new Date(server.updated_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
