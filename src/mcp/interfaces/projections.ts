/**
 * MCP v1.1 Projections Interface
 * 
 * Clean interface for Projections subsystem to interact with MCP
 * MCP → Projections → MCP
 */

import {
  MCPMessage,
  MessageContext,
  MessagePayload
} from "../core/message";
import { routeMessage, RouterContext } from "../core/router";
import { Subsystem } from "../core/routing";

/**
 * Projection generation result
 */
export interface ProjectionResult {
  success: boolean;
  scenarios: unknown[];
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Projections interface for receiving generation requests and sending results
 */
export interface ProjectionsInterface {
  /**
   * Receive projection generation request from MCP
   */
  receiveGenerationRequest(
    message: MCPMessage
  ): Promise<ProjectionResult>;

  /**
   * Send projection result back to MCP
   */
  sendProjectionResult(
    context: MessageContext,
    result: ProjectionResult
  ): Promise<void>;
}

/**
 * Creates Projections interface instance
 */
export function createProjectionsInterface(
  ctx: RouterContext,
  generationHandler?: (message: MCPMessage) => Promise<ProjectionResult>
): ProjectionsInterface {
  return {
    async receiveGenerationRequest(message) {
      if (generationHandler) {
        return generationHandler(message);
      }

      // Default: return placeholder result
      return {
        success: true,
        scenarios: [],
        metadata: {}
      };
    },

    async sendProjectionResult(context, result) {
      const message: MCPMessage = {
        context,
        intent: "PROJECTION_GENERATION",
        payload: {
          schema: "projection-result",
          schemaVersion: "1.0",
          content: result
        }
      };

      await routeMessage(message, "PROJECTIONS", "MCP", ctx);
    }
  };
}
