/**
 * MCP v1.1 Agents Interface
 * 
 * Clean interface for Agents subsystem to interact with MCP
 * MCP → Agents → MCP
 */

import {
  MCPMessage,
  MessageContext,
  MessagePayload
} from "../core/message";
import { routeMessage, RouterContext } from "../core/router";
import { Subsystem } from "../core/routing";
import {
  AgentExecutionRequest,
  AgentExecutionResult,
  validateAgentExecution,
  createAgentExecutionMessage
} from "../core/agents";

/**
 * Agents interface for receiving execution requests and sending results
 */
export interface AgentsInterface {
  /**
   * Receive agent execution request from MCP
   */
  receiveExecutionRequest(
    message: MCPMessage
  ): Promise<AgentExecutionResult>;

  /**
   * Send agent execution result back to MCP
   */
  sendExecutionResult(
    context: MessageContext,
    result: AgentExecutionResult
  ): Promise<void>;
}

/**
 * Creates Agents interface instance
 */
export function createAgentsInterface(
  ctx: RouterContext,
  executionHandler?: (request: AgentExecutionRequest) => Promise<AgentExecutionResult>
): AgentsInterface {
  return {
    async receiveExecutionRequest(message) {
      // Extract agent execution details from message
      const payload = message.payload.content as Record<string, unknown>;
      const agentId = message.context.caller.agentId || "unknown";
      const taskScope = (payload.taskScope as string) || "";
      const reversible = (payload.reversible as boolean) ?? true;

      const request: AgentExecutionRequest = {
        message,
        agentId,
        taskScope,
        reversible
      };

      // Validate execution request
      const validation = validateAgentExecution(request);
      if (!validation.valid) {
        return {
          success: false,
          agentId,
          taskScope,
          result: null,
          auditLog: [],
          error: validation.error
        };
      }

      // Execute via handler if provided
      if (executionHandler) {
        return executionHandler(request);
      }

      // Default: return placeholder result
      return {
        success: true,
        agentId,
        taskScope,
        result: null,
        auditLog: [
          {
            timestamp: new Date().toISOString(),
            action: "execution_requested",
            details: { agentId, taskScope }
          }
        ]
      };
    },

    async sendExecutionResult(context, result) {
      const message: MCPMessage = {
        context,
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-execution-result",
          schemaVersion: "1.0",
          content: result
        }
      };

      await routeMessage(message, "AGENTS", "MCP", ctx);
    }
  };
}

/**
 * Helper to create agent execution request from caller
 */
export function createAgentExecutionRequest(
  context: MessageContext,
  agentId: string,
  taskScope: string,
  payload: unknown,
  schema: string,
  schemaVersion: string
): MCPMessage {
  return createAgentExecutionMessage(
    context,
    agentId,
    taskScope,
    payload,
    schema,
    schemaVersion
  );
}
