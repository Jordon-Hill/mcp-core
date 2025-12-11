/**
 * MCP v1.1 TKD Proposal Handler
 * 
 * Handles TKD proposals as first-class MCP messages.
 * Validates proposal structure and prepares normalized envelope for KG apply.
 */

import { MCPMessage, MessageContext, MessagePayload } from "../core/message";
import { RoutingResult } from "../core/router";

/**
 * TKD Proposal structure as defined by TKD v1.1
 * Contains: type, payload, provenance
 */
export interface TKDProposal {
  /** Proposal type identifier */
  type: string;
  /** Proposal payload content */
  payload: unknown;
  /** Provenance information */
  provenance: unknown;
}

/**
 * Normalized Proposal envelope suitable for passing to KG apply layer
 */
export interface NormalizedProposal {
  /** Proposal type */
  type: string;
  /** Normalized payload */
  payload: unknown;
  /** Provenance chain */
  provenance: unknown;
  /** Original message context */
  context: MessageContext;
  /** Schema information */
  schema: {
    schema: string;
    schemaVersion: string;
  };
}

/**
 * Validation error details
 */
export interface ProposalValidationError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Result of TKD proposal handling
 */
export interface TKDProposalHandlerResult extends RoutingResult {
  /** Normalized proposal envelope (if validation succeeded) */
  proposal?: NormalizedProposal;
  /** Validation errors (if validation failed) */
  validationErrors?: ProposalValidationError[];
}

/**
 * Handles a TKD proposal message
 * 
 * Validates:
 * - intent is "TKD_PROPOSAL_APPLY"
 * - payload has required proposal fields (type, payload, provenance)
 * - provenance is present (do not normalize here, just ensure presence)
 * 
 * Returns a RoutingResult with normalized Proposal envelope if valid.
 */
export function handleTKDProposal(
  message: MCPMessage
): TKDProposalHandlerResult {
  // Validate intent
  if (message.intent !== "TKD_PROPOSAL_APPLY") {
    return {
      success: false,
      routed: false,
      halted: false,
      error: `Invalid intent: expected TKD_PROPOSAL_APPLY, got ${message.intent}`,
      validationErrors: [
        {
          code: "VALIDATION_2003",
          message: `Invalid intent: expected TKD_PROPOSAL_APPLY, got ${message.intent}`,
          field: "intent"
        }
      ]
    };
  }

  // Validate payload structure
  const validationResult = validateProposalPayload(message.payload);
  if (!validationResult.valid) {
    const errorResult: TKDProposalHandlerResult = {
      success: false,
      routed: false,
      halted: false,
      error: validationResult.error || "Proposal validation failed"
    };
    if (validationResult.errors) {
      errorResult.validationErrors = validationResult.errors;
    }
    return errorResult;
  }

  // Extract proposal from payload content
  const proposal = message.payload.content as TKDProposal;

  // Validate provenance presence (do not normalize, just ensure presence)
  if (!proposal.provenance) {
    return {
      success: false,
      routed: false,
      halted: false,
      error: "Proposal missing required provenance field",
      validationErrors: [
        {
          code: "VALIDATION_2002",
          message: "Proposal missing required provenance field",
          field: "provenance"
        }
      ]
    };
  }

  // Create normalized proposal envelope
  const normalizedProposal: NormalizedProposal = {
    type: proposal.type,
    payload: proposal.payload,
    provenance: proposal.provenance,
    context: message.context,
    schema: {
      schema: message.payload.schema,
      schemaVersion: message.payload.schemaVersion
    }
  };

  // Return success with normalized proposal
  const result: TKDProposalHandlerResult = {
    success: true,
    routed: true,
    halted: false,
    proposal: normalizedProposal
  };
  return result;
}

/**
 * Validates that payload content has required proposal fields
 */
interface PayloadValidationResult {
  valid: boolean;
  error?: string;
  errors?: ProposalValidationError[];
}

function validateProposalPayload(
  payload: MessagePayload
): PayloadValidationResult {
  const errors: ProposalValidationError[] = [];

  // Check payload content exists
  if (!payload.content) {
    errors.push({
      code: "VALIDATION_2002",
      message: "Payload content is missing",
      field: "payload.content"
    });
  }

  // Check payload content is an object
  if (
    payload.content === null ||
    typeof payload.content !== "object" ||
    Array.isArray(payload.content)
  ) {
    errors.push({
      code: "VALIDATION_2004",
      message: "Payload content must be an object",
      field: "payload.content"
    });
    return {
      valid: false,
      error: "Payload content must be an object",
      errors
    };
  }

  const proposal = payload.content as Record<string, unknown>;

  // Check required fields: type, payload, provenance
  if (!proposal.type || typeof proposal.type !== "string") {
    errors.push({
      code: "VALIDATION_2002",
      message: "Proposal missing required 'type' field",
      field: "type"
    });
  }

  if (!("payload" in proposal)) {
    errors.push({
      code: "VALIDATION_2002",
      message: "Proposal missing required 'payload' field",
      field: "payload"
    });
  }

  if (!("provenance" in proposal)) {
    errors.push({
      code: "VALIDATION_2002",
      message: "Proposal missing required 'provenance' field",
      field: "provenance"
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: `Proposal validation failed: ${errors.map((e) => e.message).join(", ")}`,
      errors
    };
  }

  return {
    valid: true
  };
}
