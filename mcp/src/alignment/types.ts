// src/alignment/types.ts

export interface AlignmentEvalRequestPayload {
  nodeId: string;
  positionSnapshotId: string;
  goalSnapshotId?: string;
  valueSnapshotId?: string;
  predictedSnapshotId?: string;
  correlationId?: string;
  requestedAt: string;
}

export type DriftLevel =
  | 'drift_0'
  | 'drift_1'
  | 'drift_2'
  | 'drift_3'
  | 'drift_4';

export interface AlignmentEvalResultPayload {
  nodeId: string;
  evaluationId: string;
  alignmentScore: number;
  driftLevel: DriftLevel;
  evaluatedAt: string;
  correlationId?: string;
  notes?: string[];
}

