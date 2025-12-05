/**
 * MCP v1.1 TKD Interface
 * 
 * Clean interface for TKD subsystem to interact with MCP
 * TKD → MCP → Crystalline
 */

import { MCPMessage, MessageContext, MessagePayload } from "../core/message";
import { routeMessage, RouterContext } from "../core/router";
import { Subsystem } from "../core/routing";

/**
 * TKD interface for sending processed data to MCP
 */
export interface TKDInterface {
  /**
   * Send processed data to MCP for routing to Crystalline
   */
  sendToMCP(
    context: MessageContext,
    intent: "DATA_INGEST" | "PATTERN_EXTRACTION",
    payload: MessagePayload,
    schema: string,
    schemaVersion: string
  ): Promise<void>;
}

/**
 * Creates TKD interface instance
 */
export function createTKDInterface(ctx: RouterContext): TKDInterface {
  return {
    async sendToMCP(context, intent, payload, schema, schemaVersion) {
      const message: MCPMessage = {
        context,
        intent,
        payload: {
          schema,
          schemaVersion,
          content: payload.content
        }
      };

      await routeMessage(message, "TKD", "MCP", ctx);
    }
  };
}
