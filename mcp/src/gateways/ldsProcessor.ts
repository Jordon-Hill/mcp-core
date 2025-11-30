import { InMemoryLdsIngestQueue } from "./ldsIngestQueue";
import { LdsIngestRecord } from "./ldsGateway";

/**
 * Minimal LDS ingest processor v0.
 *
 * Purpose:
 * - Read all records from the ingest queue
 * - Log the payloads (or simple transforms)
 * - Provide a clear hook for LDS Lite to attach real logic later
 */
export class LdsIngestProcessor {
  constructor(private readonly queue: InMemoryLdsIngestQueue) {}

  /**
   * Drain the queue and process each record.
   * v0: log the envelope payloads.
   */
  async processAll(): Promise<void> {
    const records: LdsIngestRecord[] = this.queue.drain();

    for (const record of records) {
      const envelope = record.envelope;
      const payload = envelope.body.payload;

      // Optional: log alignment evaluation events specifically
      if (envelope.body.payloadType === 'alignment.evaluation.v0') {
        // eslint-disable-next-line no-console
        console.log('[LDS] Received alignment evaluation event:', envelope.header.envelopeId);
      }

      // v0 behaviour: just log. Real LDS Lite will replace this.
      // eslint-disable-next-line no-console
      console.log(
        "[LDS PROCESSOR v0]",
        "receivedAt=",
        record.receivedAt,
        "payload=",
        payload
      );
    }
  }
}

