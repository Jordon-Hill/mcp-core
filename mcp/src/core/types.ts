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
// Error Envelope Types (MCP v1.1)
// ========================================================
export type MCPErrorClass =
  | "ERROR.TRANSPORT"
  | "ERROR.VALIDATION"
  | "ERROR.AUTH"
  | "ERROR.SAFETY"
  | "ERROR.INTERNAL"
  | "ERROR.ROUTING"
  | "ERROR.ALIGNMENT"
  | "ERROR.CONSTITUTIONAL";

export type MCPErrorSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type MCPErrorCode =
  // Transport errors (1000-1999)
  | "TRANSPORT_1001" // Connection failed
  | "TRANSPORT_1002" // Timeout
  | "TRANSPORT_1003" // Network unreachable
  | "TRANSPORT_1004" // Protocol violation
  | "TRANSPORT_1005" // Serialization error
  // Validation errors (2000-2999)
  | "VALIDATION_2001" // Schema validation failed
  | "VALIDATION_2002" // Missing required field
  | "VALIDATION_2003" // Invalid field value
  | "VALIDATION_2004" // Type mismatch
  | "VALIDATION_2005" // Constraint violation
  // Auth errors (3000-3999)
  | "AUTH_3001" // Authentication failed
  | "AUTH_3002" // Authorization denied
  | "AUTH_3003" // Invalid credentials
  | "AUTH_3004" // Token expired
  | "AUTH_3005" // Insufficient capabilities
  // Safety errors (4000-4999)
  | "SAFETY_4001" // Risk level exceeded
  | "SAFETY_4002" // Alignment violation
  | "SAFETY_4003" // Constitutional constraint violated
  | "SAFETY_4004" // Snapshot scope violation
  | "SAFETY_4005" // Reversibility check failed
  // Routing errors (5000-5999)
  | "ROUTING_5001" // Illegal route
  | "ROUTING_5002" // Target module not found
  | "ROUTING_5003" // Route blocked by policy
  | "ROUTING_5004" // Circular routing detected
  // Alignment errors (6000-6999)
  | "ALIGNMENT_6001" // Judge ruling rejected
  | "ALIGNMENT_6002" // Mediator halt
  | "ALIGNMENT_6003" // Value conflict detected
  | "ALIGNMENT_6004" // Goal drift detected
  // Constitutional errors (7000-7999)
  | "CONSTITUTIONAL_7001" // Sovereignty violation
  | "CONSTITUTIONAL_7002" // Non-coercion violation
  | "CONSTITUTIONAL_7003" // Locality violation
  | "CONSTITUTIONAL_7004" // Observability violation
  // Internal errors (8000-8999)
  | "INTERNAL_8001" // Unexpected error
  | "INTERNAL_8002" // Resource exhausted
  | "INTERNAL_8003" // State corruption
  | "INTERNAL_8004" // Configuration error
  | "INTERNAL_8005" // Dependency failure;

export interface MCPErrorRetryInfo {
  retryable: boolean;
  retryAfter?: number; // seconds
  maxRetries?: number;
  backoffStrategy?: "linear" | "exponential" | "fixed";
}

export interface MCPErrorContext {
  moduleId?: string;
  agentId?: string;
  operation?: string;
  stackTrace?: string;
  additionalData?: Record<string, unknown>;
}

export interface MCPErrorBody {
  // Core error identification
  errorClass: MCPErrorClass;
  errorCode: MCPErrorCode;
  message: string;
  correlationId: string;
  
  // Error metadata
  severity: MCPErrorSeverity;
  timestamp: string;
  
  // Error details
  details?: unknown;
  context?: MCPErrorContext;
  
  // Retry information
  retry?: MCPErrorRetryInfo;
  
  // Related errors (for error chains)
  cause?: {
    errorCode: MCPErrorCode;
    message: string;
  };
}

