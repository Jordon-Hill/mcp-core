export type MCPActor =
  | "lds"
  | "kg"
  | "tkd"
  | "projections"
  | "alignment"
  | "agent:a1"
  | "agent:a2"
  | "agent:a3"
  | "federation"
  | "ui"
  | "tool";

export type MCPEnvelopeKind =
  | "task"
  | "proposal"
  | "projection:update"
  | "alignment:check"
  | "alignment:override"
  | "tool:call"
  | "tool:result"
  | "snapshot:request"
  | "snapshot:response"
  | "federation:packet";

export interface MCPEnvelopeHeader {
  id: string;
  kind: MCPEnvelopeKind;
  createdAt: string; // ISO timestamp
  actor: MCPActor;
  room?: string;     // Finance, Farm, etc.
  lens?: string;     // Meaning, Time, Risk, etc.
  contextHash?: string;
  correlationId?: string;
  version: string;   // e.g. "1.0"
}

export interface MCPEnvelope<Payload = unknown> {
  header: MCPEnvelopeHeader;
  payload: Payload;
}
