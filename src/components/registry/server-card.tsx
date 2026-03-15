import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Package } from "lucide-react";
import type { MCPServer } from "@/lib/registry-api";

interface ServerCardProps {
  server: MCPServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const category = server.categories?.[0] ?? server.tags?.[0];
  const hasRemote = Boolean(server.remoteUrl);
  const requiresAuth = (server.remoteHeaders ?? []).some((h) => h.isRequired);

  // Encode the ID so slashes (e.g. "agency.lona/trading") don't break routing
  const href = `/server/${encodeURIComponent(server.id)}`;

  return (
    <Link href={href} className="group block">
      <Card className="h-full border-border/50 bg-card/50 transition-all duration-200 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-black/20 group-hover:-translate-y-0.5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {server.name}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasRemote ? (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                  <Wifi className="h-2.5 w-2.5" />
                  {requiresAuth ? "auth" : "live"}
                </span>
              ) : (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/30">
                  <Package className="h-2.5 w-2.5" />
                  local
                </span>
              )}
              {server.version && (
                <Badge variant="secondary" className="shrink-0 text-xs font-mono">
                  v{server.version}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {server.description ?? "No description available."}
          </p>
          {category && (
            <div className="mt-3">
              <Badge variant="outline" className="text-xs capitalize">
                {category}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
