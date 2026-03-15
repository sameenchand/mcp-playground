import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MCPServer } from "@/lib/registry-api";

interface ServerCardProps {
  server: MCPServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const category = server.categories?.[0] ?? server.tags?.[0];

  return (
    <Link href={`/server/${server.id}`} className="group block">
      <Card className="h-full border-border/50 bg-card/50 transition-all duration-200 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-black/20 group-hover:-translate-y-0.5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {server.name}
            </h3>
            {server.version && (
              <Badge variant="secondary" className="shrink-0 text-xs font-mono">
                v{server.version}
              </Badge>
            )}
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
