/**
 * Custom MCP Transport for WebContainer stdio streams.
 * Bridges WebContainerProcess stdin/stdout ↔ MCP SDK Client.
 * Client-side only.
 *
 * IMPORTANT: WebContainers echo stdin to stdout. Every message we write
 * to process.input appears verbatim on process.output before the server's
 * actual response. We must filter these echoes to avoid the MCP SDK Client
 * trying to handle its own outgoing messages as incoming ones.
 */

import type { Transport, TransportSendOptions } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import type { WebContainerProcess } from "@webcontainer/api";

/**
 * MCP Transport that reads/writes JSON-RPC messages over a WebContainerProcess's
 * stdin (WritableStream) and stdout (ReadableStream).
 *
 * Messages are newline-delimited JSON, one per line — the standard stdio MCP framing.
 */
export class WebContainerTransport implements Transport {
  private process: WebContainerProcess;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private reading = false;

  /**
   * Shared output reader state. Because WebContainer's process.output is a
   * ReadableStream that can only be read once (data is consumed), we use a
   * single reader + buffer pattern that persists across transport instances
   * sharing the same process. Pass the same SharedReader to reuse buffered data.
   */
  private sharedReader: SharedReader;

  sessionId?: string;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(process: WebContainerProcess, sharedReader?: SharedReader) {
    this.process = process;
    this.sharedReader = sharedReader ?? createSharedReader(process);
  }

  getSharedReader(): SharedReader {
    return this.sharedReader;
  }

  async start(): Promise<void> {
    // Get a writer for stdin
    this.writer = this.process.input.getWriter();

    // Start reading stdout in the background
    this.reading = true;
    this.sharedReader.subscribe(this.handleLine);
    this.sharedReader.startIfNeeded();
  }

  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (!this.writer) {
      throw new Error("Transport not started — call start() first");
    }

    const json = JSON.stringify(message) + "\n";

    // Register the outgoing message so the shared reader can filter the echo
    this.sharedReader.addSentMessage(json.trim());

    await this.writer.write(json);
  }

  /**
   * Close the transport (release writer, stop reading).
   * Does NOT kill the underlying process — process lifecycle is managed
   * externally by the hook. This is critical because the MCP SDK Client
   * calls transport.close() internally when initialization fails (e.g.,
   * server not ready yet), and we need the process to stay alive for retries.
   */
  async close(): Promise<void> {
    this.reading = false;
    this.sharedReader.unsubscribe(this.handleLine);
    this.releaseWriter();
    this.onclose?.();
  }

  /**
   * Close the transport AND kill the underlying process.
   * Only call this when you're completely done with the server.
   */
  async destroy(): Promise<void> {
    this.reading = false;
    this.sharedReader.unsubscribe(this.handleLine);
    this.sharedReader.stop();
    this.releaseWriter();
    this.process.kill();
    this.onclose?.();
  }

  private releaseWriter(): void {
    try {
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Handle a parsed JSON-RPC line from the shared reader.
   * Arrow function to preserve `this` binding.
   */
  private handleLine = (message: JSONRPCMessage): void => {
    if (!this.reading) return;
    this.onmessage?.(message);
  };
}

// ── Shared Reader ────────────────────────────────────────────────────────────

type LineCallback = (message: JSONRPCMessage) => void;

export interface SharedReader {
  subscribe(cb: LineCallback): void;
  unsubscribe(cb: LineCallback): void;
  startIfNeeded(): void;
  stop(): void;
  /** Register a message we're about to send, so we can filter its echo. */
  addSentMessage(json: string): void;
}

/**
 * Creates a shared stdout reader for a WebContainer process.
 * Only ONE reader can exist per ReadableStream, so we share it across
 * transport instances (important for retry logic).
 *
 * Also handles stdin echo filtering — WebContainers echo everything
 * written to process.input back through process.output.
 */
export function createSharedReader(process: WebContainerProcess): SharedReader {
  const subscribers = new Set<LineCallback>();
  let running = false;
  let reader: ReadableStreamDefaultReader<string> | null = null;

  /**
   * Set of JSON strings we've sent to stdin. When we see these come back
   * on stdout, we skip them (they're echoes, not server responses).
   * Each entry is removed after it's matched once.
   */
  const pendingEchoes = new Set<string>();

  async function readLoop(): Promise<void> {
    reader = process.output.getReader();
    let buffer = "";

    try {
      while (running) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Only parse lines that look like JSON-RPC (start with '{')
          if (!trimmed.startsWith("{")) {
            // Non-JSON output (e.g. "Starting default (STDIO) server...")
            continue;
          }

          // Check if this is an echo of something we sent
          if (pendingEchoes.has(trimmed)) {
            pendingEchoes.delete(trimmed);
            // Stdin echo filtered
            continue;
          }

          try {
            const message = JSON.parse(trimmed) as JSONRPCMessage;
            // Deliver to subscribers
            for (const cb of subscribers) {
              cb(message);
            }
          } catch {
            // Not valid JSON — likely stderr mixed into stdout, skip
          }
        }
      }
    } catch (err) {
      if (running) {
        console.error("[mcp-transport] readLoop error:", err);
      }
    } finally {
      if (reader) {
        try { reader.releaseLock(); } catch { /* ignore */ }
        reader = null;
      }
      running = false;
    }
  }

  return {
    subscribe(cb: LineCallback) {
      subscribers.add(cb);
    },
    unsubscribe(cb: LineCallback) {
      subscribers.delete(cb);
    },
    startIfNeeded() {
      if (!running) {
        running = true;
        void readLoop();
      }
    },
    stop() {
      running = false;
      if (reader) {
        try { reader.releaseLock(); } catch { /* ignore */ }
        reader = null;
      }
    },
    addSentMessage(json: string) {
      pendingEchoes.add(json);
      // Safety: clean up after 10s to prevent memory leaks if echo never comes
      setTimeout(() => pendingEchoes.delete(json), 10_000);
    },
  };
}
