/**
 * Canonical payload types for MCP-FED.
 * These describe how nodes exchange snapshots, patterns, and rule deltas.
 */

// Snapshot offers / requests
export const FED_SNAPSHOT_OFFER = "FED.SNAPSHOT.OFFER";
export const FED_SNAPSHOT_REQUEST = "FED.SNAPSHOT.REQUEST";

// Pattern / rule delta exchange
export const FED_PATTERN_OFFER = "FED.PATTERN.OFFER";
export const FED_RULE_DELTA = "FED.RULE.DELTA";

// Alignment summaries between nodes
export const FED_ALIGNMENT_SUMMARY = "FED.ALIGNMENT.SUMMARY";

export interface FederatedSnapshotOfferPayload {
  snapshotId: string;
  fromNodeId: string;
  description?: string;
}

export interface FederatedSnapshotRequestPayload {
  snapshotId: string;
  reason?: string;
}

export interface FederatedPatternOfferPayload {
  patternId: string;
  fromNodeId: string;
  description?: string;
}

export interface FederatedRuleDeltaPayload {
  ruleId: string;
  fromNodeId: string;
  version: string;
  delta: unknown; // TKD-defined structure
}

/**
 * Lightweight alignment summary between nodes.
 * No raw data; just meta-signals.
 */
export interface FederatedAlignmentSummaryPayload {
  fromNodeId: string;
  toNodeId: string;
  timeRangeStart: string;
  timeRangeEnd: string;
  driftEvents: number;
  contradictionEvents: number;
  notes?: string;
}

