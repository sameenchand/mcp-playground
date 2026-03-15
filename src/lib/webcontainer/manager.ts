/**
 * WebContainer lifecycle manager — singleton.
 * Manages boot, package install, and process spawn for in-browser MCP servers.
 * Client-side only — never import on the server.
 */

import { WebContainer, type WebContainerProcess } from "@webcontainer/api";

export type ContainerStatus =
  | "idle"
  | "booting"
  | "installing"
  | "spawning"
  | "ready"
  | "error";

export interface ContainerState {
  status: ContainerStatus;
  error?: string;
  installLog: string[];
}

let containerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

/**
 * Boot the WebContainer runtime. Only boots once per page — subsequent calls
 * return the existing instance.
 */
export async function bootContainer(): Promise<WebContainer> {
  if (containerInstance) return containerInstance;
  if (bootPromise) return bootPromise;

  bootPromise = WebContainer.boot().then((instance) => {
    containerInstance = instance;
    return instance;
  });

  return bootPromise;
}

/**
 * Install an npm package inside the WebContainer.
 * Writes a minimal package.json and runs `npm install`.
 * Calls `onLog` with each line of output for progress streaming.
 */
export async function installPackage(
  container: WebContainer,
  packageName: string,
  version?: string,
  onLog?: (line: string) => void,
): Promise<void> {
  const dep = version ? `${packageName}@${version}` : packageName;

  await container.mount({
    "package.json": {
      file: {
        contents: JSON.stringify(
          { name: "mcp-sandbox", private: true, dependencies: { [packageName]: version ?? "latest" } },
          null,
          2,
        ),
      },
    },
  });

  const installProcess = await container.spawn("npm", ["install", "--prefer-offline"]);

  // Stream install output — WebContainer output is ReadableStream<string>
  const reader = installProcess.output.getReader();
  let buffer = "";

  const readOutput = async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) onLog?.(line);
      }
    }
    if (buffer.trim()) onLog?.(buffer);
  };

  await readOutput();
  const exitCode = await installProcess.exit;

  if (exitCode !== 0) {
    throw new Error(`npm install failed for ${dep} (exit code ${exitCode})`);
  }
}

/**
 * Resolve the binary command for a package by reading its package.json `bin` field.
 * Falls back to package name if bin can't be resolved.
 */
async function resolveBin(
  container: WebContainer,
  packageName: string,
): Promise<string> {
  try {
    const pkgJsonStr = await container.fs.readFile(
      `node_modules/${packageName}/package.json`,
      "utf-8",
    );
    const pkgJson = JSON.parse(pkgJsonStr) as {
      bin?: string | Record<string, string>;
      main?: string;
    };

    if (typeof pkgJson.bin === "string") {
      return `node_modules/${packageName}/${pkgJson.bin}`;
    }
    if (typeof pkgJson.bin === "object" && pkgJson.bin !== null) {
      // Use the first bin entry
      const firstBin = Object.values(pkgJson.bin)[0];
      if (firstBin) return `node_modules/${packageName}/${firstBin}`;
    }
    if (pkgJson.main) {
      return `node_modules/${packageName}/${pkgJson.main}`;
    }
  } catch {
    // Fall through to npx fallback
  }

  // Fallback: use npx to resolve
  return "";
}

/**
 * Spawn an MCP server process inside the WebContainer.
 * Resolves the binary from the installed package and runs it directly,
 * bypassing npx for more reliable startup.
 * Returns the process handle whose stdin/stdout can be used for MCP communication.
 */
export async function spawnServer(
  container: WebContainer,
  packageName: string,
  args: string[] = [],
  env: Record<string, string> = {},
): Promise<WebContainerProcess> {
  const binPath = await resolveBin(container, packageName);

  let process: WebContainerProcess;

  if (binPath) {
    // Run the binary directly with node — most reliable in WebContainer
    process = await container.spawn("node", [binPath, ...args], {
      env: { ...env, NODE_ENV: "production" },
    });
  } else {
    // Fallback: use npx (package already installed, no -y needed)
    process = await container.spawn("npx", [packageName, ...args], {
      env: { ...env, NODE_ENV: "production" },
    });
  }

  return process;
}

/**
 * Get the current container instance (if booted).
 */
export function getContainer(): WebContainer | null {
  return containerInstance;
}
