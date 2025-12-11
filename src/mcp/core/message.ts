/**
 * MCP v1.1 Message Model
 * 
 * Implements: Message Model section
 * Each message is a triple: context, intent, payload
 * Free-form, untyped payloads are forbidden.
 */

/**
 * Context contains caller identity, session state, permissions, and provenance
 */
export interface MessageContext {
  /** Caller identity (node, module, agent) */
  caller: Identity;
  /** Session state identifier */
  sessionId: string;
  /** Permissions granted to this caller */
  permissions: Permission[];
  /** Provenance chain for this message */
  provenance: ProvenanceEntry[];
  /** Timestamp when context was created */
  timestamp: string;
}

/**
 * Identity of the caller (node, module, or agent)
 */
export interface Identity {
  nodeId: string;
  moduleId?: string;
  agentId?: string;
}

/**
 * Permission granted to the caller
 */
export interface Permission {
  resource: string;
  action: string;
  scope?: string;
}

/**
 * Provenance entry tracking message route
 */
export interface ProvenanceEntry {
  nodeId: string;
  moduleId?: string;
  timestamp: string;
}

/**
 * Intent represents the high-level purpose of the message
 * Examples: ANALYSIS, PATTERN_EXTRACTION, KG_MUTATION_PROPOSAL
 */
export type Intent =
  | "ANALYSIS"
  | "PATTERN_EXTRACTION"
  | "KG_MUTATION_PROPOSAL"
  | "ALIGNMENT_REVIEW"
  | "AGENT_EXECUTION"
  | "FEDERATION_HANDSHAKE"
  | "PROJECTION_GENERATION"
  | "DATA_INGEST"
  | "QUERY"
  | "UPDATE"
  | "TKD_PROPOSAL_APPLY";

/**
 * Payload is typed and schema-declared content
 * Free-form, untyped payloads are forbidden.
 */
export interface MessagePayload<T = unknown> {
  /** Schema identifier for type checking */
  schema: string;
  /** Version of the schema */
  schemaVersion: string;
  /** Typed content */
  content: T;
}

/**
 * Complete MCP v1.1 Message
 */
export interface MCPMessage<T = unknown> {
  context: MessageContext;
  intent: Intent;
  payload: MessagePayload<T>;
}
