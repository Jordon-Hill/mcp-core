// ========================================================
//  MCP — Core Types
// ========================================================

export type MCPMessageType =
  | "REQUEST"
  | "RESPONSE"
  | "EVENT"
  | "COMMAND"
  | "PATTERN_OFFER"
  | "SNAPSHOT_OFFER"
  | "RULE_DELTA"
  | "ALERT";

export interface MCPEnvelope {
  header: MCPHeader;
  body: MCPBody;
  provenance: MCPProvenance;
  safety: MCPSafety;
}

// ========================================================
// Header
// ========================================================
export interface MCPHeader {
  envelopeId: string; 
  timestamp: string;  
  version: string;    
  layer: "MCP-IO" | "MCP-AGENT" | "MCP-FED";
  type: MCPMessageType;
  priority?: "LOW" | "NORMAL" | "HIGH";
  source: MCPIdentityRef;
  target: MCPIdentityRef;
  capabilities: CapabilitySet;
}

// ========================================================
// Body
// ========================================================
export interface MCPBody {
  payloadType: string;
  payload: unknown;
}

// ========================================================
// Provenance
// ========================================================
export interface MCPProvenance {
  route: MCPRouteEntry[];
  hash: string;
  signature: string;
  contextRefs?: string[];
}

export interface MCPRouteEntry {
  nodeId: string;
  moduleId?: string;
  agentId?: string;
  timestamp: string;
}

// ========================================================
// Safety Layer
// ========================================================
export interface MCPSafety {
  snapshotScope: string;
  alignmentFlags?: AlignmentFlag[];
  riskLevel?: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export type AlignmentFlag =
  | "VALUE_CONFLICT"
  | "GOAL_DRIFT"
  | "CONTRADICTION"
  | "HIGH_RISK_ACTION";

// ========================================================
// Identity + Capability Types
// ========================================================
export interface MCPIdentityRef {
  nodeId: string;
  moduleId?: string;
  agentId?: string;
}

export interface CapabilitySet {
  declared: Capability[];
  required?: Capability[];
}

export interface Capability {
  id: string;    
  description?: string;
}

// ========================================================
// Routing Table Definitions
// ========================================================
export interface MCPRoutingTable {
  io: MCPRouteMap;
  agent: MCPRouteMap;
  fed: MCPRouteMap;
}

export interface MCPRouteMap {
  [payloadType: string]: MCPRouteTarget;
}

export interface MCPRouteTarget {
  targetModule: string;
  handler: string;
}

// ========================================================
// Error Envelope Types
// ========================================================
export type MCPErrorClass =
  | "ERROR.TRANSPORT"
  | "ERROR.VALIDATION"
  | "ERROR.AUTH"
  | "ERROR.SAFETY"
  | "ERROR.INTERNAL";

export interface MCPErrorBody {
  errorClass: MCPErrorClass;
  message: string;
  correlationId: string;
  details?: unknown;
}

