// src/mcp/log_store.ts
//
// MCP Log Store v1
// -----------------
// Append-only, deterministic log for MCP envelopes.
// - Local only
// - Replayable
// - Integrity-aware (hash chain)
// - Simple JSONL file backing (optional, can be swapped later)

import { promises as fs } from "fs";
import * as path from "path";
import { createHash } from "crypto";
import type { MCPEnvelope } from "../envelope";

export interface LogEntry {
  index: number;           // monotonic, zero-based or 1-based; here: 0-based
  timestamp: string;       // log write time (ISO)
  envelope: MCPEnvelope;
  hash: string;            // SHA-256 of envelope + prevHash
  prevHash: string | null; // previous entry hash (null for first)
}

export interface LogCursor {
  index: number;           // next index to read from
}

export interface AppendResult {
  index: number;
  hash: string;
}

/**
 * MCPLogStore
 *
 * Responsibilities:
 * - Maintain an append-only sequence of LogEntry objects.
 * - Provide deterministic ordering for envelopes.
 * - Persist to disk as JSONL (one LogEntry per line).
 * - Provide replay APIs (getSince).
 */
export class MCPLogStore {
  private entries: LogEntry[] = [];
  private filePath: string;
  private initialized = false;

  constructor(options?: { filePath?: string }) {
    const defaultPath = path.join(process.cwd(), "data", "mcp_log.jsonl");
    this.filePath = options?.filePath ?? defaultPath;
  }

  /**
   * Initialize the log store by reading existing entries from disk.
   * Idempotent; safe to call multiple times.
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const data = await fs.readFile(this.filePath, "utf8");
      const lines = data.split("\n").filter(Boolean);

      this.entries = lines.map((line) => {
        const parsed = JSON.parse(line) as LogEntry;
        return parsed;
      });

      // Optional: integrity check of hash chain (can be upgraded later).
      this.verifyChain();

      this.initialized = true;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // No existing log file; ensure directory exists.
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        this.entries = [];
        this.initialized = true;
        return;
      }
      throw err;
    }
  }

  /**
   * Append a new MCP envelope to the log.
   * Returns the assigned index + hash.
   */
  public async append(envelope: MCPEnvelope): Promise<AppendResult> {
    if (!this.initialized) {
      await this.init();
    }

    const index = this.entries.length;
    const timestamp = new Date().toISOString();
    const prevHash = index === 0 ? null : this.entries[index - 1].hash;

    const hash = this.computeHash(envelope, prevHash, index, timestamp);

    const entry: LogEntry = {
      index,
      timestamp,
      envelope,
      hash,
      prevHash,
    };

    this.entries.push(entry);

    // Persist to disk as JSONL append.
    const line = JSON.stringify(entry) + "\n";
    await fs.appendFile(this.filePath, line, "utf8");

    return { index, hash };
  }

  /**
   * Get all entries from a given cursor/index onwards.
   * Useful for deterministic replay or diagnostics.
   */
  public getSince(cursor: LogCursor | number): LogEntry[] {
    const idx = typeof cursor === "number" ? cursor : cursor.index;
    if (idx < 0 || idx > this.entries.length) return [];
    return this.entries.slice(idx);
  }

  /**
   * Get a single entry by envelope id (if present).
   */
  public getByEnvelopeId(id: string): LogEntry | undefined {
    return this.entries.find((entry) => entry.envelope.header.id === id);
  }

  /**
   * Get the current log length (next index to be assigned).
   */
  public getLength(): number {
    return this.entries.length;
  }

  /**
   * Expose all entries (read-only copy) – use cautiously.
   * Primarily for debugging / introspection.
   */
  public getAll(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Compute a deterministic hash over the entry content + prevHash.
   * This is not a consensus chain; just local integrity.
   */
  private computeHash(
    envelope: MCPEnvelope,
    prevHash: string | null,
    index: number,
    timestamp: string
  ): string {
    const h = createHash("sha256");
    const canonical = JSON.stringify({
      index,
      timestamp,
      envelope,
      prevHash,
    });
    h.update(canonical);
    return h.digest("hex");
  }

  /**
   * Verify hash chain integrity in memory.
   * Throws if a mismatch is detected. This can be called at boot.
   */
  private verifyChain(): void {
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const expectedPrev =
        i === 0 ? null : this.entries[i - 1].hash;

      if (entry.prevHash !== expectedPrev) {
        throw new Error(
          `MCP log chain broken at index ${i}: prevHash mismatch`
        );
      }

      const recomputed = this.computeHash(
        entry.envelope,
        entry.prevHash,
        entry.index,
        entry.timestamp
      );

      if (recomputed !== entry.hash) {
        throw new Error(
          `MCP log hash mismatch at index ${i}: expected ${entry.hash}, got ${recomputed}`
        );
      }
    }
  }
}
