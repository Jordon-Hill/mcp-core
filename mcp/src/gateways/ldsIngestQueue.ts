import { LdsIngestRecord, LdsIngestSink } from "./ldsGateway";

/**
 * Simple in-memory ingest queue for LDS.
 * v0: good enough for demos and local dev.
 */
export class InMemoryLdsIngestQueue implements LdsIngestSink {
  private records: LdsIngestRecord[] = [];

  async push(record: LdsIngestRecord): Promise<void> {
    this.records.push(record);
  }

  /**
   * Read all records without clearing.
   */
  peek(): LdsIngestRecord[] {
    return [...this.records];
  }

  /**
   * Drain the queue and return all records.
   */
  drain(): LdsIngestRecord[] {
    const out = [...this.records];
    this.records = [];
    return out;
  }
}

