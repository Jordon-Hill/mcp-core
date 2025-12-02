export type MCPIntent = "query" | "action" | "mutation";

export interface MCPEnvelope {
  origin: string;             // module-id, e.g. "crystalline", "cli"
  target: string;             // module-id, e.g. "alignment-engine"
  timestamp: string;          // ISO-8601
  trace_id: string;           // UUID
  payload: any;               // module-specific
  intent: MCPIntent;
  side_effects: string[];     // e.g. ["write:crystalline", "append:alignment-log"]
  schema_version: string;     // "1.0"
}

