/**
 * LoggingTransport — wraps any MCP Transport to capture all JSON-RPC messages.
 * Server-side only. Used by the Traffic Inspector feature.
 */

import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

export interface TrafficEntry {
  /** "tx" = client → server, "rx" = server → client */
  direction: "tx" | "rx";
  /** Timestamp in milliseconds (Date.now()) */
  timestamp: number;
  /** The raw JSON-RPC message */
  message: JSONRPCMessage;
}

export class LoggingTransport implements Transport {
  private inner: Transport;
  private _log: TrafficEntry[] = [];

  constructor(inner: Transport) {
    this.inner = inner;
  }

  /** Get all captured traffic entries. */
  get log(): TrafficEntry[] {
    return this._log;
  }

  async start(): Promise<void> {
    await this.inner.start?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    this._log.push({ direction: "tx", timestamp: Date.now(), message });
    await this.inner.send(message);
  }

  async close(): Promise<void> {
    await this.inner.close();
  }

  // ── Callback proxying ────────────────────────────────────────────────

  get onmessage() {
    return this.inner.onmessage;
  }

  set onmessage(cb: ((message: JSONRPCMessage) => void) | undefined) {
    if (cb) {
      this.inner.onmessage = (msg: JSONRPCMessage) => {
        this._log.push({ direction: "rx", timestamp: Date.now(), message: msg });
        cb(msg);
      };
    } else {
      this.inner.onmessage = undefined;
    }
  }

  get onclose() {
    return this.inner.onclose;
  }

  set onclose(cb: (() => void) | undefined) {
    this.inner.onclose = cb;
  }

  get onerror() {
    return this.inner.onerror;
  }

  set onerror(cb: ((error: Error) => void) | undefined) {
    this.inner.onerror = cb;
  }

  get sessionId() {
    return this.inner.sessionId;
  }

  set sessionId(id: string | undefined) {
    this.inner.sessionId = id;
  }
}
