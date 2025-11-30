// src/alignment/alignmentEngineAdapter.ts

import {
  AlignmentEvalRequestPayload,
  AlignmentEvalResultPayload,
  DriftLevel,
} from './types';

/**
 * Temporary, local drift mapper.
 * Keep in sync with Alignment Engine until we call it directly.
 */
function driftLevelFromScore(score: number): DriftLevel {
  if (score >= 0.9) return 'drift_0';
  if (score >= 0.75) return 'drift_1';
  if (score >= 0.5) return 'drift_2';
  if (score >= 0.25) return 'drift_3';
  return 'drift_4';
}

/**
 * v0 adapter:
 * - Uses the SAME request/result shapes as the real engine.
 * - Still computes a local dummy score for now.
 *
 * Next patch:
 * - Replace internals with a real call into the Alignment Engine
 *   (HTTP, CLI, or module import).
 */
export async function evaluateAlignmentViaAdapter(
  request: AlignmentEvalRequestPayload,
): Promise<AlignmentEvalResultPayload> {
  // TODO: Call real Alignment Engine.
  const alignmentScore = 0.8;

  const evaluationId = [
    'mcp-eval',
    request.nodeId,
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 6),
  ].join('_');

  const driftLevel = driftLevelFromScore(alignmentScore);

  return {
    nodeId: request.nodeId,
    evaluationId,
    alignmentScore,
    driftLevel,
    evaluatedAt: new Date().toISOString(),
    correlationId: request.correlationId,
    notes: [
      'v0 MCP adapter: local dummy evaluation. Replace with real Alignment Engine call.',
    ],
  };
}

