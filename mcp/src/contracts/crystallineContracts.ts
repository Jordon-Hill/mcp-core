/**
 * Canonical payload types for Crystalline-related envelopes.
 * Used for KG snapshot requests / responses over MCP-AGENT.
 */

export const CRYS_SNAPSHOT_REQUEST = "CRYS.SNAPSHOT.REQUEST";
export const CRYS_SNAPSHOT_RESPONSE = "CRYS.SNAPSHOT.RESPONSE";

export interface CrystallineSnapshotRequestPayload {
  snapshotId: string; // requested snapshot id
  includeMeta?: boolean;
}

export interface CrystallineSnapshotResponsePayload {
  snapshotId: string;
  createdAt: string;
  meta?: Record<string, unknown>;
  // Actual KG contents live outside MCP, referenced indirectly
  kgRef: string; // e.g. file path, object id, etc.
}

