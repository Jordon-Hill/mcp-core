// src/demo/demoAlignmentGateway.ts

import {
  AlignmentEvalRequestPayload,
  AlignmentEvalResultPayload,
} from '../alignment/types';
import { evaluateAlignmentViaAdapter } from '../alignment/alignmentEngineAdapter';

/**
 * Minimal demo that:
 *  - builds a request payload
 *  - calls the MCP alignment adapter
 *  - logs the result
 *
 * Later we'll:
 *  - wrap this result in an MCP envelope
 *  - send it into LDS / Projections
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

  // For now, just log it. We'll envelope it in the next patch.
  console.log('[DemoAlignmentGateway] alignment eval result:', result);

  return result;
}

