const REGISTRY_BASE = "https://registry.modelcontextprotocol.io";

export interface RemoteHeader {
  name: string;
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
}

export interface MCPServer {
  id: string;          // server.name — stable unique identifier e.g. "io.github.user/repo"
  name: string;        // display name: server.title ?? server.name
  description: string;
  version?: string;
  websiteUrl?: string;
  repository?: { url?: string };
  remoteUrl?: string;        // first entry in server.remotes[], if any
  remoteHeaders?: RemoteHeader[]; // auth headers required for the remote endpoint
  packages?: Array<{
    registry_name?: string;  // "npm" | "pypi" etc.
    name?: string;
    version?: string;
  }>;
  categories?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

// --- Raw API types ---

interface RawRemote {
  type: string;
  url: string;
  headers?: RemoteHeader[];
}

interface RawServerData {
  name: string;
  title?: string;
  description?: string;
  version?: string;
  websiteUrl?: string;
  repository?: { url?: string; source?: string; id?: string; subfolder?: string };
  remotes?: RawRemote[];
  packages?: Array<{ registry_name?: string; name?: string; version?: string }>;
  categories?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

interface RawServerEntry {
  server: RawServerData;
  _meta?: Record<string, unknown>;
}

interface V01ListResponse {
  servers: RawServerEntry[];
  metadata?: { nextCursor?: string; count?: number };
}

interface V01DetailResponse {
  server: RawServerData;
  _meta?: Record<string, unknown>;
}

// --- Mapper ---

function mapServer(raw: RawServerData): MCPServer {
  const firstRemote = raw.remotes?.[0];
  return {
    id: raw.name,
    name: raw.title ?? raw.name,
    description: raw.description ?? "",
    version: raw.version,
    websiteUrl: raw.websiteUrl,
    repository: raw.repository ? { url: raw.repository.url } : undefined,
    remoteUrl: firstRemote?.url,
    remoteHeaders: firstRemote?.headers,
    packages: raw.packages,
    categories: raw.categories,
    tags: raw.tags,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

// --- Public API ---

export async function fetchServers(): Promise<MCPServer[]> {
  try {
    const res = await fetch(`${REGISTRY_BASE}/v0.1/servers?limit=100`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Registry API error: ${res.status}`);
    const data: V01ListResponse = await res.json();
    const seen = new Set<string>();
    return (data.servers ?? [])
      .map((entry) => mapServer(entry.server))
      .filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
  } catch (error) {
    console.error("Failed to fetch servers from registry:", error);
    return [];
  }
}

export async function fetchServerById(id: string): Promise<MCPServer | null> {
  try {
    const encoded = encodeURIComponent(id);
    const res = await fetch(
      `${REGISTRY_BASE}/v0.1/servers/${encoded}/versions/latest`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Registry API error: ${res.status}`);
    }
    const data: V01DetailResponse = await res.json();
    return mapServer(data.server);
  } catch (error) {
    console.error(`Failed to fetch server ${id}:`, error);
    return null;
  }
}
