/**
 * MCP v1.1 Router
 * 
 * Implements: Core routing logic combining Legal Routing Graph and Constitutional Constraints
 * This is the main entry point for routing messages through MCP
 */

import { MCPMessage } from "./message";
import { Subsystem, isLegalRoute } from "./routing";
import {
  validateConstitutionalConstraints,
  ConstraintValidationResult
} from "./constraints";
import {
  forwardForAlignmentReview,
  applyJudgeRuling,
  isMediatorHalted,
  requiresAlignmentReview,
  AlignmentReviewResult
} from "./alignment";

/**
 * Routing result
 */
export interface RoutingResult {
  success: boolean;
  routed: boolean;
  halted: boolean;
  error?: string;
  alignmentResult?: AlignmentReviewResult;
  constraintResult?: ConstraintValidationResult;
}

/**
 * Router context for handling messages
 */
export interface RouterContext {
  /** Current node identity */
  currentNodeId: string;
  /** Handler for routing messages to subsystems */
  routeHandler: (message: MCPMessage, to: Subsystem) => Promise<void>;
  /** Handler for alignment review (optional, defaults to internal) */
  alignmentHandler?: (
    message: MCPMessage,
    from: Subsystem,
    to: Subsystem
  ) => Promise<AlignmentReviewResult>;
}

/**
 * Routes a message through MCP according to v1.1 specification
 * 
 * Process:
 * 1. Validate legal routing
 * 2. Check constitutional constraints
 * 3. Forward to Alignment if required
 * 4. Apply Judge rulings or Mediator halts
 * 5. Route to target subsystem
 */
export async function routeMessage(
  message: MCPMessage,
  from: Subsystem,
  to: Subsystem,
  ctx: RouterContext
): Promise<RoutingResult> {
  // Step 1: Validate legal routing
  if (!isLegalRoute(from, to, message.intent)) {
    return {
      success: false,
      routed: false,
      halted: false,
      error: `Illegal route: ${from} → ${to} with intent ${message.intent}`
    };
  }

  // Step 2: Check constitutional constraints
  const constraintResult = validateConstitutionalConstraints(message, from, to);
  if (!constraintResult.valid) {
    return {
      success: false,
      routed: false,
      halted: true,
      constraintResult,
      error: constraintResult.explanation
    };
  }

  // Step 3: Forward to Alignment if required
  let alignmentResult: AlignmentReviewResult | undefined;
  if (requiresAlignmentReview(from, to, message.intent)) {
    const alignmentHandler =
      ctx.alignmentHandler ||
      ((msg, f, t) =>
        forwardForAlignmentReview({ message: msg, from: f, to: t, requiresReview: true }));

    alignmentResult = await alignmentHandler(message, from, to);

    // Step 4: Check if Mediator halted
    if (isMediatorHalted(alignmentResult)) {
      return {
        success: false,
        routed: false,
        halted: true,
        alignmentResult,
        constraintResult,
        error: "Message halted by Mediator"
      };
    }

    // Step 5: Apply Judge rulings (modifications)
    if (alignmentResult && !alignmentResult.approved && alignmentResult.modifications) {
      message = applyJudgeRuling(message, alignmentResult);
    }

    // If not approved and no modifications, halt
    if (!alignmentResult.approved && !alignmentResult.modifications) {
      return {
        success: false,
        routed: false,
        halted: true,
        alignmentResult,
        constraintResult,
        error: alignmentResult.explanation || "Message rejected by Alignment"
      };
    }
  }

  // Step 6: Route to target subsystem
  try {
    await ctx.routeHandler(message, to);
    return {
      success: true,
      routed: true,
      halted: false,
      alignmentResult,
      constraintResult
    };
  } catch (error) {
    return {
      success: false,
      routed: false,
      halted: false,
      alignmentResult,
      constraintResult,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
