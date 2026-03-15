/**
 * Custom MCP Transport for WebContainer stdio streams.
 * Bridges WebContainerProcess stdin/stdout ↔ MCP SDK Client.
 * Client-side only.
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
  private abortController = new AbortController();

  sessionId?: string;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(process: WebContainerProcess) {
    this.process = process;
  }

  async start(): Promise<void> {
    // Get a writer for stdin
    this.writer = this.process.input.getWriter();

    // Start reading stdout in the background
    this.reading = true;
    void this.readLoop();
  }

  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (!this.writer) {
      throw new Error("Transport not started — call start() first");
    }

    const json = JSON.stringify(message) + "\n";
    await this.writer.write(json);
  }

  async close(): Promise<void> {
    this.reading = false;
    this.abortController.abort();

    try {
      if (this.writer) {
        await this.writer.close().catch(() => {});
        this.writer = null;
      }
    } catch {
      // Ignore close errors
    }

    this.process.kill();
    this.onclose?.();
  }

  /**
   * Continuously reads from the process stdout, parsing newline-delimited JSON-RPC messages.
   * Handles partial lines (buffering) and ignores non-JSON stderr noise.
   */
  private async readLoop(): Promise<void> {
    const reader = this.process.output.getReader();
    let buffer = "";

    try {
      while (this.reading) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Only parse lines that look like JSON-RPC (start with '{')
          if (!trimmed.startsWith("{")) continue;

          try {
            const message = JSON.parse(trimmed) as JSONRPCMessage;
            this.onmessage?.(message);
          } catch {
            // Not valid JSON — likely stderr mixed into stdout, skip
          }
        }
      }
    } catch (err) {
      if (this.reading) {
        this.onerror?.(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      reader.releaseLock();
      if (this.reading) {
        // Unexpected end of stream
        this.reading = false;
        this.onclose?.();
      }
    }
  }
}
