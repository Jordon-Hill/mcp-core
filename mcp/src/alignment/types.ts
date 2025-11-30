// src/alignment/types.ts

/**
 * Request from MCP (or other callers) asking for an alignment evaluation
 * over a given node + KG snapshots.
 */
export interface AlignmentEvalRequestPayload {
  nodeId: string;
  positionSnapshotId: string;
  goalSnapshotId?: string;
  valueSnapshotId?: string;
  predictedSnapshotId?: string;
  correlationId?: string;
  requestedAt: string;
}

/**
 * Normalised drift levels – must match the Alignment Engine.
 */
export type DriftLevel =
  | 'drift_0'
  | 'drift_1'
  | 'drift_2'
  | 'drift_3'
  | 'drift_4';

/**
 * Minimal evaluation result payload used by MCP and external callers.
 */
export interface AlignmentEvalResultPayload {
  nodeId: string;
  evaluationId: string;
  alignmentScore: number;
  driftLevel: DriftLevel;
  evaluatedAt: string;
  correlationId?: string;
  notes?: string[];
}

