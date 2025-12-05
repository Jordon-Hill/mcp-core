/**
 * Tests for MCP v1.1 Agent Orchestration
 */

import {
  validateAgentExecution,
  createAgentExecutionMessage,
  canSpawnRecursively,
  AgentExecutionRequest
} from "../src/mcp/core/agents";
import { MessageContext, MCPMessage } from "../src/mcp/core/message";

describe("Agent Orchestration", () => {
  const createTestContext = (): MessageContext => ({
    caller: {
      nodeId: "local",
      moduleId: "MCP"
    },
    sessionId: "test-session",
    permissions: [],
    provenance: [],
    timestamp: new Date().toISOString()
  });

  describe("validateAgentExecution", () => {
    it("should validate correct agent execution request", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-execution",
          schemaVersion: "1.0",
          content: {}
        }
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: true
      };

      const result = validateAgentExecution(request);
      expect(result.valid).toBe(true);
    });

    it("should reject agent execution not invoked via MCP", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          caller: {
            nodeId: "local",
            moduleId: "OTHER_MODULE"
          }
        },
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-execution",
          schemaVersion: "1.0",
          content: {}
        }
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: true
      };

      const result = validateAgentExecution(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("MCP");
    });

    it("should reject execution without task scope", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-execution",
          schemaVersion: "1.0",
          content: {}
        }
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "",
        reversible: true
      };

      const result = validateAgentExecution(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("task scope");
    });

    it("should reject non-reversible execution", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-execution",
          schemaVersion: "1.0",
          content: {}
        }
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: false
      };

      const result = validateAgentExecution(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("reversible");
    });

    it("should allow non-reversible constitutional changes", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-execution",
          schemaVersion: "1.0",
          content: {
            constitutional: true
          }
        }
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: false
      };

      const result = validateAgentExecution(request);
      expect(result.valid).toBe(true);
    });

    it("should reject attempts to modify LDS", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "update",
          schemaVersion: "1.0",
          content: {
            target: "LDS"
          }
        }
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: true
      };

      const result = validateAgentExecution(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("LDS");
    });

    it("should reject attempts to modify KG", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "update",
          schemaVersion: "1.0",
          content: {
            target: "KG"
          }
        }
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: true
      };

      const result = validateAgentExecution(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("KG");
    });
  });

  describe("createAgentExecutionMessage", () => {
    it("should create valid agent execution message", () => {
      const context = createTestContext();
      const message = createAgentExecutionMessage(
        context,
        "agent-1",
        "test-task",
        { test: "data" },
        "test-schema",
        "1.0"
      );

      expect(message.context.caller.agentId).toBe("agent-1");
      expect(message.intent).toBe("AGENT_EXECUTION");
      expect(
        (message.payload.content as Record<string, unknown>).taskScope
      ).toBe("test-task");
      expect(
        (message.payload.content as Record<string, unknown>).reversible
      ).toBe(true);
    });
  });

  describe("canSpawnRecursively", () => {
    it("should allow spawning from non-agent context", () => {
      const context: MessageContext = {
        ...createTestContext(),
        caller: {
          nodeId: "local",
          moduleId: "MCP"
        }
      };

      expect(canSpawnRecursively(context, "child-agent")).toBe(true);
    });

    it("should disallow recursive spawning from agent context", () => {
      const context: MessageContext = {
        ...createTestContext(),
        caller: {
          nodeId: "local",
          moduleId: "MCP",
          agentId: "parent-agent"
        }
      };

      expect(canSpawnRecursively(context, "child-agent")).toBe(false);
    });
  });
});
