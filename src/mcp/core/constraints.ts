/**
 * MCP v1.1 Constitutional Constraints
 * 
 * Implements: Constitutional Constraints section
 * Routing decisions must respect:
 * - non-coercion (no action may reduce user or node sovereignty)
 * - preserve locality (no external authority can override a node)
 * - ensure reversibility of all non-constitutional state changes
 * - remain fully observable and explainable
 */

import { MCPMessage, Intent } from "./message";
import { Subsystem } from "./routing";

/**
 * Constraint violation type
 */
export type ConstraintViolation =
  | "NON_COERCION_VIOLATION"
  | "LOCALITY_VIOLATION"
  | "REVERSIBILITY_VIOLATION"
  | "OBSERVABILITY_VIOLATION";

/**
 * Result of constraint validation
 */
export interface ConstraintValidationResult {
  valid: boolean;
  violations: ConstraintViolation[];
  explanation?: string;
}

/**
 * Validates constitutional constraints on a routing decision
 */
export function validateConstitutionalConstraints(
  message: MCPMessage,
  from: Subsystem,
  to: Subsystem
): ConstraintValidationResult {
  const violations: ConstraintViolation[] = [];

  // Non-coercion check: no action may reduce user or node sovereignty
  if (violatesNonCoercion(message, from, to)) {
    violations.push("NON_COERCION_VIOLATION");
  }

  // Locality check: no external authority can override a node
  if (violatesLocality(message, from, to)) {
    violations.push("LOCALITY_VIOLATION");
  }

  // Reversibility check: ensure reversibility of non-constitutional state changes
  if (violatesReversibility(message, from, to)) {
    violations.push("REVERSIBILITY_VIOLATION");
  }

  // Observability check: must be fully observable and explainable
  if (violatesObservability(message)) {
    violations.push("OBSERVABILITY_VIOLATION");
  }

  return {
    valid: violations.length === 0,
    violations,
    explanation:
      violations.length > 0
        ? `Constitutional constraints violated: ${violations.join(", ")}`
        : undefined
  };
}

/**
 * Checks if routing violates non-coercion principle
 * No action may reduce user or node sovereignty
 */
function violatesNonCoercion(
  message: MCPMessage,
  from: Subsystem,
  to: Subsystem
): boolean {
  // Check if message attempts to override node autonomy
  const payload = message.payload.content as Record<string, unknown>;
  
  // If attempting to force a node to accept external control
  if (
    to === "MCP" &&
    payload &&
    typeof payload === "object" &&
    "force" in payload &&
    payload.force === true
  ) {
    return true;
  }

  // If attempting to reduce permissions without consent
  if (
    message.intent === "UPDATE" &&
    payload &&
    typeof payload === "object" &&
    "reducePermissions" in payload &&
    payload.reducePermissions === true
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if routing violates locality principle
 * No external authority can override a node
 */
function violatesLocality(
  message: MCPMessage,
  from: Subsystem,
  to: Subsystem
): boolean {
  // External nodes cannot override local node decisions
  const callerNodeId = message.context.caller.nodeId;
  const isExternalCall = callerNodeId !== "local"; // Assuming "local" is the current node

  // External nodes cannot force local node actions
  if (
    isExternalCall &&
    (to === "MCP" || to === "ALIGNMENT") &&
    message.intent === "UPDATE"
  ) {
    const payload = message.payload.content as Record<string, unknown>;
    if (payload && typeof payload === "object" && "override" in payload) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if routing violates reversibility principle
 * All non-constitutional state changes must be reversible
 */
function violatesReversibility(
  message: MCPMessage,
  from: Subsystem,
  to: Subsystem
): boolean {
  // State-changing operations must include reversal metadata
  const stateChangingIntents: Intent[] = [
    "KG_MUTATION_PROPOSAL",
    "UPDATE",
    "AGENT_EXECUTION"
  ];

  if (stateChangingIntents.includes(message.intent)) {
    const payload = message.payload.content as Record<string, unknown>;
    
    // Must include reversal information
    if (
      !payload ||
      typeof payload !== "object" ||
      !("reversible" in payload) ||
      payload.reversible !== true
    ) {
      // If it's a constitutional change, reversibility not required
      if (
        payload &&
        typeof payload === "object" &&
        "constitutional" in payload &&
        payload.constitutional === true
      ) {
        return false;
      }
      return true;
    }
  }

  return false;
}

/**
 * Checks if routing violates observability principle
 * All operations must be fully observable and explainable
 */
function violatesObservability(message: MCPMessage): boolean {
  // Must have complete provenance
  if (!message.context.provenance || message.context.provenance.length === 0) {
    return true;
  }

  // Must have caller identity
  if (!message.context.caller || !message.context.caller.nodeId) {
    return true;
  }

  // Must have session tracking
  if (!message.context.sessionId) {
    return true;
  }

  // Payload must have schema declaration
  if (!message.payload.schema || !message.payload.schemaVersion) {
    return true;
  }

  return false;
}
