/**
 * MCP v1.1 Crystalline (KG) Interface
 * 
 * Clean interface for Crystalline subsystem to interact with MCP
 * MCP → Crystalline → MCP
 */

import {
  MCPMessage,
  MessageContext,
  MessagePayload
} from "../core/message";
import { routeMessage, RouterContext } from "../core/router";
import { Subsystem } from "../core/routing";

/**
 * KG operation result
 */
export interface KGOperationResult {
  success: boolean;
  operation: "QUERY" | "MUTATION";
  result?: unknown;
  error?: string;
}

/**
 * Crystalline interface for receiving KG operations and sending results
 */
export interface CrystallineInterface {
  /**
   * Receive KG operation request from MCP
   */
  receiveOperation(
    message: MCPMessage
  ): Promise<KGOperationResult>;

  /**
   * Send KG operation result back to MCP
   */
  sendOperationResult(
    context: MessageContext,
    result: KGOperationResult
  ): Promise<void>;
}

/**
 * Creates Crystalline interface instance
 */
export function createCrystallineInterface(
  ctx: RouterContext,
  operationHandler?: (message: MCPMessage) => Promise<KGOperationResult>
): CrystallineInterface {
  return {
    async receiveOperation(message) {
      if (operationHandler) {
        return operationHandler(message);
      }

      // Default: return placeholder result
      return {
        success: true,
        operation:
          message.intent === "KG_MUTATION_PROPOSAL" ? "MUTATION" : "QUERY",
        result: null
      };
    },

    async sendOperationResult(context, result) {
      const intent =
        result.operation === "MUTATION"
          ? "KG_MUTATION_PROPOSAL"
          : "QUERY";

      const message: MCPMessage = {
        context,
        intent,
        payload: {
          schema: "kg-operation-result",
          schemaVersion: "1.0",
          content: result
        }
      };

      await routeMessage(message, "CRYSTALLINE", "MCP", ctx);
    }
  };
}
