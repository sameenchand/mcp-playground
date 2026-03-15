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
 * Spawn an MCP server process inside the WebContainer.
 * Returns the process handle whose stdin/stdout can be used for MCP communication.
 */
export async function spawnServer(
  container: WebContainer,
  packageName: string,
  args: string[] = [],
  env: Record<string, string> = {},
): Promise<WebContainerProcess> {
  const process = await container.spawn("npx", ["-y", packageName, ...args], {
    env: { ...env, NODE_ENV: "production" },
  });

  return process;
}

/**
 * Get the current container instance (if booted).
 */
export function getContainer(): WebContainer | null {
  return containerInstance;
}
