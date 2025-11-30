/**
 * Canonical payloadType strings for Agent-related envelopes.
 * These live primarily on MCP-AGENT and sometimes MCP-IO.
 */

// Commands
export const AGENT_EXECUTE_PROCEDURE = "AGENT.EXECUTE.PROCEDURE";
export const AGENT_CANCEL_PROCEDURE = "AGENT.CANCEL.PROCEDURE";

// Events
export const AGENT_EVENT_STARTED = "AGENT.EVENT.STARTED";
export const AGENT_EVENT_COMPLETED = "AGENT.EVENT.COMPLETED";
export const AGENT_EVENT_FAILED = "AGENT.EVENT.FAILED";

/**
 * Deterministic procedure execution command.
 * Agents must treat this as a sealed, replayable instruction.
 */
export interface AgentExecuteProcedurePayload {
  procedureId: string; // canonical procedure definition id
  runId: string; // unique id for this run
  snapshotScope: string; // must be sealed or explicitly LIVE
  parameters: Record<string, unknown>;
}

/**
 * Procedure lifecycle event payloads.
 */
export interface AgentProcedureEventPayloadBase {
  procedureId: string;
  runId: string;
  snapshotScope: string;
}

export interface AgentProcedureStartedPayload
  extends AgentProcedureEventPayloadBase {
  startedAt: string;
}

export interface AgentProcedureCompletedPayload
  extends AgentProcedureEventPayloadBase {
  completedAt: string;
  resultSummary?: string;
}

export interface AgentProcedureFailedPayload
  extends AgentProcedureEventPayloadBase {
  failedAt: string;
  errorMessage: string;
  errorDetails?: unknown;
}

