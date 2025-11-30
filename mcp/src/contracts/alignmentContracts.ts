import { AlignmentFlag } from "../core/types";

/**
 * Canonical payloadType strings for Alignment-related envelopes.
 * These are used on MCP-AGENT layer.
 */
export const ALIGN_EVAL_REQUEST = "ALIGN.EVAL.REQUEST";
export const ALIGN_EVAL_RESULT = "ALIGN.EVAL.RESULT";
export const ALIGN_ALERT_DRIFT = "ALIGN.ALERT.DRIFT";
export const ALIGN_ALERT_CONTRADICTION = "ALIGN.ALERT.CONTRADICTION";

/**
 * Request Alignment Engine to evaluate a situation.
 * Typically sent from Agents / Projections / Crystalline via MCP-AGENT.
 */
export interface AlignmentEvalRequestPayload {
  subjectId: string; // e.g. KG node id, procedure id, scenario id
  snapshotScope: string; // e.g. "LIVE" or snapshot id
  contextRefs?: string[]; // optional extra KG / snapshot references
}

/**
 * Result from Alignment Engine.
 */
export interface AlignmentEvalResultPayload {
  subjectId: string;
  snapshotScope: string;
  score: number; // Sᵢ alignment score
  flags?: AlignmentFlag[];
  traceId: string; // for triad trace / provenance
}

/**
 * Drift / contradiction alerts.
 */
export interface AlignmentAlertPayload {
  subjectId: string;
  snapshotScope: string;
  flags: AlignmentFlag[];
  message?: string;
  traceId: string;
}

