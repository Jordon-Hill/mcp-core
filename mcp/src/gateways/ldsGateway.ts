import { MCPEnvelope } from "../core/types";

export interface LdsGateway {
  /**
   * Handle an MCP envelope targeted at LDS.
   * v0: primarily ingest and sealed snapshot queries.
   */
  handle(envelope: MCPEnvelope): Promise<void>;
}

/**
 * Ingest record format for LDS.
 */
export interface LdsIngestRecord {
  envelope: MCPEnvelope;
  receivedAt: string;
}

/**
 * Generic sink for LDS ingest records.
 * LDS Lite (in its own repo) can later consume from this.
 */
export interface LdsIngestSink {
  push(record: LdsIngestRecord): Promise<void> | void;
}

/**
 * LDS gateway that pushes envelopes into an ingest sink.
 */
export class QueueLdsGateway implements LdsGateway {
  constructor(private sink: LdsIngestSink) {}

  async handle(envelope: MCPEnvelope): Promise<void> {
    await this.sink.push({
      envelope,
      receivedAt: new Date().toISOString(),
    });
  }
}

/**
 * No-op LDS gateway for tests / wiring.
 */
export class NoopLdsGateway implements LdsGateway {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(_envelope: MCPEnvelope): Promise<void> {
    // Intentionally empty – real logic lives in LDS repo.
  }
}
