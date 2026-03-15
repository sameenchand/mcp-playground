import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, ArrowLeft, Wrench, Database, MessageSquare, Zap } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchServerById } from "@/lib/registry-api";

interface ServerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ServerPageProps) {
  const { id } = await params;
  const server = await fetchServerById(id);
  if (!server) return { title: "Server Not Found — MCP Playground" };
  return {
    title: `${server.name} — MCP Playground`,
    description: server.description,
  };
}

export default async function ServerPage({ params }: ServerPageProps) {
  const { id } = await params;
  const server = await fetchServerById(id);

  if (!server) notFound();

  const repoUrl = server.repository?.url;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </Link>

      {/* Server Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">{server.name}</h1>
            {server.version && (
              <Badge variant="secondary" className="font-mono text-xs">
                v{server.version}
              </Badge>
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
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Repository
            </a>
          )}
          <Link
            href="/connect"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Inspect Live
          </Link>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Placeholder capability sections */}
      <div className="grid grid-cols-1 gap-4">
        <PlaceholderSection
          icon={Wrench}
          title="Tools"
          description="This is a package for local installation — it doesn't expose a remote HTTP endpoint. Use Connect by URL to inspect a live remote MCP server."
        />
        <PlaceholderSection
          icon={Database}
          title="Resources"
          description="Resource URIs and templates are only available for servers with remote HTTP endpoints."
        />
        <PlaceholderSection
          icon={MessageSquare}
          title="Prompts"
          description="Server-defined prompts are only available for servers with remote HTTP endpoints."
        />
      </div>
    </div>
  );
}

function PlaceholderSection({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-1.5 rounded-md bg-muted border border-border/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground pl-10">{description}</p>
    </div>
  );
}
