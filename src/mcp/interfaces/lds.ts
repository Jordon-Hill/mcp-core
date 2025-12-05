/**
 * MCP v1.1 LDS Interface
 * 
 * Clean interface for LDS subsystem to interact with MCP
 * LDS → TKD → MCP → Crystalline
 */

import { MCPMessage, MessageContext, MessagePayload } from "../core/message";
import { routeMessage, RouterContext } from "../core/router";
import { Subsystem } from "../core/routing";

/**
 * LDS interface for sending data to MCP
 */
export interface LDSInterface {
  /**
   * Send ingested data to TKD via MCP
   */
  sendToTKD(
    context: MessageContext,
    payload: MessagePayload,
    schema: string,
    schemaVersion: string
  ): Promise<void>;
}

/**
 * Creates LDS interface instance
 */
export function createLDSInterface(ctx: RouterContext): LDSInterface {
  return {
    async sendToTKD(context, payload, schema, schemaVersion) {
      const message: MCPMessage = {
        context,
        intent: "DATA_INGEST",
        payload: {
          schema,
          schemaVersion,
          content: payload.content
        }
      };

      await routeMessage(message, "LDS", "TKD", ctx);
    }
  };
}
