// src/demo/demoAlignmentGateway.ts

import {
  AlignmentEvalRequestPayload,
  AlignmentEvalResultPayload,
} from '../alignment/types';
import { evaluateAlignmentViaAdapter } from '../alignment/alignmentEngineAdapter';
import { createEnvelope, enqueueEnvelope } from '../core/envelopeService';

/**
 * Minimal demo that:
 *  - builds a request payload
 *  - calls the MCP alignment adapter
 *  - wraps result in an MCP envelope
 *  - sends it into LDS / Projections
 */
export async function runDemoAlignmentGateway(): Promise<AlignmentEvalResultPayload> {
  const request: AlignmentEvalRequestPayload = {
    nodeId: 'demo-node',
    positionSnapshotId: 'demo-position-snapshot',
    goalSnapshotId: 'demo-goal-snapshot',
    valueSnapshotId: 'demo-value-snapshot',
    predictedSnapshotId: 'demo-predicted-snapshot',
    requestedAt: new Date().toISOString(),
    correlationId: 'demo-correlation-id',
  };

  const result = await evaluateAlignmentViaAdapter(request);

  // Build the MCP envelope using your standard v0 structure
  const envelope = createEnvelope({
    type: 'alignment.evaluation.v0',
    payload: result,
  });

  // Push into LDS ingest queue
  await enqueueEnvelope(envelope);

  console.log('[DemoAlignmentGateway] Envelope queued:', envelope.header.envelopeId);

  return result;
}

