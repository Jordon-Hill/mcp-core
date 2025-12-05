/**
 * MCP v1.1 Alignment Interface
 * 
 * Clean interface for Alignment subsystem to interact with MCP
 * MCP → Alignment → MCP
 */

import {
  MCPMessage,
  MessageContext,
  MessagePayload,
  Intent
} from "../core/message";
import { routeMessage, RouterContext } from "../core/router";
import { Subsystem } from "../core/routing";
import {
  AlignmentReviewResult,
  forwardForAlignmentReview
} from "../core/alignment";

/**
 * Alignment interface for receiving review requests and sending results
 */
export interface AlignmentInterface {
  /**
   * Receive alignment review request from MCP
   * This is called by MCP when a message requires alignment review
   */
  receiveReviewRequest(
    message: MCPMessage,
    from: Subsystem,
    to: Subsystem
  ): Promise<AlignmentReviewResult>;

  /**
   * Send alignment review result back to MCP
   */
  sendReviewResult(
    context: MessageContext,
    reviewResult: AlignmentReviewResult,
    originalMessageId: string
  ): Promise<void>;
}

/**
 * Creates Alignment interface instance
 */
export function createAlignmentInterface(
  ctx: RouterContext,
  reviewHandler?: (
    message: MCPMessage,
    from: Subsystem,
    to: Subsystem
  ) => Promise<AlignmentReviewResult>
): AlignmentInterface {
  return {
    async receiveReviewRequest(message, from, to) {
      if (reviewHandler) {
        return reviewHandler(message, from, to);
      }
      return forwardForAlignmentReview({
        message,
        from,
        to,
        requiresReview: true
      });
    },

    async sendReviewResult(context, reviewResult, originalMessageId) {
      const message: MCPMessage = {
        context,
        intent: "ALIGNMENT_REVIEW",
        payload: {
          schema: "alignment-review-result",
          schemaVersion: "1.0",
          content: {
            reviewResult,
            originalMessageId
          }
        }
      };

      await routeMessage(message, "ALIGNMENT", "MCP", ctx);
    }
  };
}
