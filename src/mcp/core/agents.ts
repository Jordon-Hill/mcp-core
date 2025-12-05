/**
 * MCP v1.1 Agent Orchestration
 * 
 * Implements: Agent Orchestration section
 * Agents:
 * - are invoked only via MCP
 * - operate on scoped tasks
 * - must be fully auditable and reversible
 * - cannot modify LDS or the KG
 * - cannot spawn recursively outside MCP rules
 */

import { MCPMessage, Intent, MessageContext } from "./message";

/**
 * Agent execution request
 */
export interface AgentExecutionRequest {
  message: MCPMessage;
  agentId: string;
  taskScope: string;
  reversible: boolean;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  success: boolean;
  agentId: string;
  taskScope: string;
  result: unknown;
  auditLog: AuditEntry[];
  reversalToken?: string; // Token to reverse this execution
  error?: string;
}

/**
 * Audit entry for agent execution
 */
export interface AuditEntry {
  timestamp: string;
  action: string;
  details: Record<string, unknown>;
}

/**
 * Validates agent execution request according to MCP v1.1 rules
 */
export function validateAgentExecution(
  request: AgentExecutionRequest
): { valid: boolean; error?: string } {
  const { message, agentId, taskScope, reversible } = request;

  // Agents must be invoked only via MCP
  if (message.context.caller.moduleId !== "MCP") {
    return {
      valid: false,
      error: "Agents can only be invoked via MCP"
    };
  }

  // Must operate on scoped tasks
  if (!taskScope || taskScope.trim().length === 0) {
    return {
      valid: false,
      error: "Agent execution must have a defined task scope"
    };
  }

  // Must be reversible (unless constitutional)
  const payload = message.payload.content as Record<string, unknown>;
  const isConstitutional =
    payload &&
    typeof payload === "object" &&
    "constitutional" in payload &&
    payload.constitutional === true;

  if (!reversible && !isConstitutional) {
    return {
      valid: false,
      error: "Agent execution must be reversible unless it's a constitutional change"
    };
  }

  // Agents cannot modify LDS or KG directly
  if (
    message.intent === "UPDATE" &&
    payload &&
    typeof payload === "object"
  ) {
    const target = payload.target as string;
    if (target === "LDS" || target === "KG") {
      return {
        valid: false,
        error: "Agents cannot modify LDS or KG directly"
      };
    }
  }

  return { valid: true };
}

/**
 * Creates an agent execution message
 * This is the interface for callers to request agent execution
 */
export function createAgentExecutionMessage(
  context: MessageContext,
  agentId: string,
  taskScope: string,
  payload: unknown,
  schema: string,
  schemaVersion: string
): MCPMessage {
  return {
    context: {
      ...context,
      caller: {
        ...context.caller,
        agentId
      }
    },
    intent: "AGENT_EXECUTION",
    payload: {
      schema,
      schemaVersion,
      content: {
        ...(payload as Record<string, unknown>),
        taskScope,
        reversible: true
      }
    }
  };
}

/**
 * Checks if agent execution can spawn recursively
 * Agents cannot spawn recursively outside MCP rules
 */
export function canSpawnRecursively(
  parentContext: MessageContext,
  childAgentId: string
): boolean {
  // Check if parent is already an agent execution
  if (parentContext.caller.agentId) {
    // Recursive spawning is only allowed if explicitly permitted by MCP
    // For now, we disallow recursive spawning
    return false;
  }

  return true;
}
