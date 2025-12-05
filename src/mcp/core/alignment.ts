/**
 * MCP v1.1 Alignment Integration
 * 
 * Implements: Alignment and MCP section
 * MCP is responsible for:
 * - forwarding requests for constitutional review
 * - applying Judge rulings
 * - enforcing Mediator halts or modifications
 * - ensuring no subsystem can sidestep Alignment
 */

import { MCPMessage, Intent } from "./message";
import { Subsystem } from "./routing";

/**
 * Alignment actor types
 */
export type AlignmentActor = "ACTOR" | "JUDGE" | "MEDIATOR";

/**
 * Alignment review result
 */
export interface AlignmentReviewResult {
  approved: boolean;
  actor: AlignmentActor;
  ruling?: string;
  modifications?: Partial<MCPMessage>;
  halt?: boolean;
  explanation: string;
}

/**
 * Alignment review request
 */
export interface AlignmentReviewRequest {
  message: MCPMessage;
  from: Subsystem;
  to: Subsystem;
  requiresReview: boolean;
}

/**
 * Forwards a message to Alignment for constitutional review
 */
export async function forwardForAlignmentReview(
  request: AlignmentReviewRequest
): Promise<AlignmentReviewResult> {
  // This is a placeholder - actual implementation would call Alignment subsystem
  // MCP forwards the request but does not implement Alignment itself
  
  const { message, from, to } = request;

  // Check if this requires alignment review
  const requiresReview = shouldRequireAlignmentReview(message, from, to);
  
  if (!requiresReview) {
    return {
      approved: true,
      actor: "ACTOR",
      explanation: "No alignment review required for this message"
    };
  }

  // Forward to Alignment subsystem
  // In actual implementation, this would be an async call to Alignment
  // For now, return a placeholder that indicates review is needed
  return {
    approved: false,
    actor: "JUDGE",
    ruling: "Pending alignment review",
    explanation: "Message forwarded to Alignment for constitutional review"
  };
}

/**
 * Determines if a message requires alignment review
 */
function shouldRequireAlignmentReview(
  message: MCPMessage,
  from: Subsystem,
  to: Subsystem
): boolean {
  // High-risk intents always require review
  const highRiskIntents: Intent[] = [
    "KG_MUTATION_PROPOSAL",
    "AGENT_EXECUTION",
    "UPDATE"
  ];

  if (highRiskIntents.includes(message.intent)) {
    return true;
  }

  // Agent execution always requires review
  if (to === "AGENTS") {
    return true;
  }

  // KG mutations require review
  if (to === "CRYSTALLINE" && message.intent === "KG_MUTATION_PROPOSAL") {
    return true;
  }

  return false;
}

/**
 * Applies a Judge ruling to a message
 */
export function applyJudgeRuling(
  message: MCPMessage,
  ruling: AlignmentReviewResult
): MCPMessage {
  if (!ruling.approved && ruling.modifications) {
    // Apply modifications from Judge
    return {
      ...message,
      ...ruling.modifications
    };
  }

  return message;
}

/**
 * Checks if Mediator has halted the message
 */
export function isMediatorHalted(ruling: AlignmentReviewResult): boolean {
  return ruling.actor === "MEDIATOR" && ruling.halt === true;
}

/**
 * Ensures no subsystem can sidestep Alignment
 * All messages to certain subsystems must go through Alignment review
 */
export function requiresAlignmentReview(
  from: Subsystem,
  to: Subsystem,
  intent: Intent
): boolean {
  // Agents always require alignment review
  if (to === "AGENTS") {
    return true;
  }

  // KG mutations require review
  if (to === "CRYSTALLINE" && intent === "KG_MUTATION_PROPOSAL") {
    return true;
  }

  // Direct routes that bypass MCP are disallowed
  if (from !== "MCP" && to !== "MCP") {
    return true; // This should be caught by routing validation
  }

  return false;
}
