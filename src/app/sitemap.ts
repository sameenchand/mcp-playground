import type { MetadataRoute } from "next";
import { fetchServers } from "@/lib/registry-api";

export const revalidate = 3600; // regenerate every hour

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://mcpplayground.tech";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE,                               priority: 1.0, changeFrequency: "daily"   },
  { url: `${BASE}/explore`,                  priority: 0.9, changeFrequency: "hourly"  },
  { url: `${BASE}/connect`,                  priority: 0.8, changeFrequency: "monthly" },
  { url: `${BASE}/playground`,               priority: 0.8, changeFrequency: "monthly" },
  { url: `${BASE}/lint`,                     priority: 0.7, changeFrequency: "monthly" },
  { url: `${BASE}/quality`,                  priority: 0.7, changeFrequency: "daily"   },
  { url: `${BASE}/about`,                    priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE}/docs`,                     priority: 0.6, changeFrequency: "weekly"  },
  { url: `${BASE}/docs/getting-started`,     priority: 0.6, changeFrequency: "weekly"  },
  { url: `${BASE}/docs/grading`,             priority: 0.6, changeFrequency: "weekly"  },
  { url: `${BASE}/docs/api`,                 priority: 0.6, changeFrequency: "weekly"  },
  { url: `${BASE}/docs/connecting-servers`,  priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE}/docs/local-servers`,       priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE}/docs/faq`,                 priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE}/docs/sandbox`,             priority: 0.5, changeFrequency: "monthly" },
  { url: `${BASE}/docs/embedding`,           priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const servers = await fetchServers();

  const serverRoutes: MetadataRoute.Sitemap = servers.map((server) => ({
    url: `${BASE}/server/${encodeURIComponent(server.id)}`,
    priority: 0.6,
    changeFrequency: "weekly" as const,
    lastModified: server.updated_at ? new Date(server.updated_at) : undefined,
  }));

  return [...STATIC_ROUTES, ...serverRoutes];
}
