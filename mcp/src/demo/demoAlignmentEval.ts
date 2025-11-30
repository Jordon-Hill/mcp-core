// src/demo/demoAlignmentEval.ts

import {
  AlignmentEvalRequestPayload,
  AlignmentEvalResultPayload,
} from '../alignment/types';
import { evaluateAlignmentViaAdapter } from '../alignment/alignmentEngineAdapter';

export async function runDemoAlignmentEval(): Promise<AlignmentEvalResultPayload> {
  const request: AlignmentEvalRequestPayload = {
    nodeId: 'demo-node',
    positionSnapshotId: 'demo-position',
    goalSnapshotId: 'demo-goal',
    valueSnapshotId: 'demo-value',
    predictedSnapshotId: 'demo-predicted',
    requestedAt: new Date().toISOString(),
    correlationId: 'demo-correlation',
  };

  const result = await evaluateAlignmentViaAdapter(request);

  // If you have a logger, you can swap this for logInfo(...)
  console.log('Demo alignment evaluation result:', result);

  return result;
}

