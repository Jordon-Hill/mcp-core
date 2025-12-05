/**
 * Tests for MCP v1.1 Routing Failure Errors
 * 
 * Covers: Federation, agent, and alignment routing failures producing MCP errors.
 * Tests that routing failures in these subsystems produce appropriate error types.
 */

import {
  verifyNodeIdentity,
  negotiateCapabilities,
  performFederationHandshake,
  FederationHandshakeRequest,
} from "../src/mcp/core/federation";
import {
  validateAgentExecution,
  AgentExecutionRequest,
} from "../src/mcp/core/agents";
import {
  forwardForAlignmentReview,
  isMediatorHalted,
  AlignmentReviewRequest,
} from "../src/mcp/core/alignment";
import {
  createAuthError,
  createRoutingError,
  createAlignmentError,
  createConstitutionalError,
  createValidationError,
} from "../mcp/src/core/error";
import {
  MCPMessage,
  MessageContext,
} from "../src/mcp/core/message";

/**
 * Helper to convert federation handshake failure to MCP error
 */
function federationFailureToError(
  response: { success: boolean; error?: string; verified?: boolean; compatible?: boolean },
  correlationId: string
) {
  if (response.success) {
    return null;
  }

  if (!response.verified) {
    return createAuthError(
      response.error || "Node identity verification failed",
      correlationId,
      "AUTH_3001",
      { verified: false }
    );
  }

  if (!response.compatible) {
    return createRoutingError(
      response.error || "Capability negotiation failed",
      correlationId,
      "ROUTING_5003",
      { compatible: false }
    );
  }

  return createRoutingError(
    response.error || "Federation handshake failed",
    correlationId,
    "ROUTING_5002"
  );
}

/**
 * Helper to convert agent execution validation failure to MCP error
 */
function agentExecutionFailureToError(
  validation: { valid: boolean; error?: string },
  correlationId: string
) {
  if (validation.valid) {
    return null;
  }

  if (validation.error?.includes("invoked via MCP")) {
    return createRoutingError(
      validation.error,
      correlationId,
      "ROUTING_5001",
      { subsystem: "AGENTS" }
    );
  }

  if (validation.error?.includes("task scope")) {
    return createValidationError(
      validation.error,
      correlationId,
      "VALIDATION_2002"
    );
  }

  if (validation.error?.includes("reversible")) {
    return createConstitutionalError(
      validation.error,
      correlationId,
      "CONSTITUTIONAL_7002"
    );
  }

  if (validation.error?.includes("LDS") || validation.error?.includes("KG")) {
    return createConstitutionalError(
      validation.error,
      correlationId,
      "CONSTITUTIONAL_7001"
    );
  }

  return createValidationError(
    validation.error || "Agent execution validation failed",
    correlationId,
    "VALIDATION_2001"
  );
}

/**
 * Helper to convert alignment review failure to MCP error
 */
function alignmentFailureToError(
  result: { approved: boolean; halt?: boolean; actor?: string; explanation: string },
  correlationId: string
) {
  if (result.approved) {
    return null;
  }

  if (result.halt && result.actor === "MEDIATOR") {
    return createAlignmentError(
      result.explanation || "Message halted by Mediator",
      correlationId,
      "ALIGNMENT_6002",
      { actor: result.actor }
    );
  }

  if (result.actor === "JUDGE") {
    return createAlignmentError(
      result.explanation || "Message rejected by Judge",
      correlationId,
      "ALIGNMENT_6001",
      { actor: result.actor }
    );
  }

  return createAlignmentError(
    result.explanation || "Alignment review failed",
    correlationId,
    "ALIGNMENT_6001"
  );
}

describe("Routing Failure Errors", () => {
  const correlationId = "test-correlation-routing";

  const createTestContext = (): MessageContext => ({
    caller: {
      nodeId: "local",
      moduleId: "MCP",
    },
    sessionId: "test-session",
    permissions: [],
    provenance: [
      {
        nodeId: "local",
        moduleId: "MCP",
        timestamp: new Date().toISOString(),
      },
    ],
    timestamp: new Date().toISOString(),
  });

  describe("Federation Routing Failures", () => {
    test("produces AUTH_3001 for node identity verification failure", () => {
      const identity = { nodeId: "" }; // Invalid identity

      const result = verifyNodeIdentity(identity);

      expect(result.verified).toBe(false);

      const handshakeResponse = {
        success: false,
        verified: false,
        compatible: false,
        error: result.error,
      };

      const error = federationFailureToError(handshakeResponse, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.AUTH");
      expect(error?.errorCode).toBe("AUTH_3001");
      expect(error?.message).toContain("nodeId");
    });

    test("produces AUTH_3001 for reserved 'local' node identity", () => {
      const identity = { nodeId: "local" }; // Reserved identity

      const result = verifyNodeIdentity(identity);

      expect(result.verified).toBe(false);

      const handshakeResponse = {
        success: false,
        verified: false,
        compatible: false,
        error: result.error,
      };

      const error = federationFailureToError(handshakeResponse, correlationId);

      expect(error?.errorClass).toBe("ERROR.AUTH");
      expect(error?.errorCode).toBe("AUTH_3001");
    });

    test("produces ROUTING_5003 for capability negotiation failure", () => {
      const requesting = {
        nodeId: "node-1",
        supportedIntents: ["QUERY"],
        alignmentCompatible: true,
        autonomyLevel: "FULL" as const,
        syncCapabilities: [],
      };

      const target = {
        nodeId: "node-2",
        supportedIntents: ["UPDATE"], // No common intents
        alignmentCompatible: true,
        autonomyLevel: "FULL" as const,
        syncCapabilities: [],
      };

      const negotiation = negotiateCapabilities(requesting, target);

      expect(negotiation.compatible).toBe(false);

      const handshakeResponse = {
        success: false,
        verified: true,
        compatible: false,
        error: negotiation.error,
      };

      const error = federationFailureToError(handshakeResponse, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.ROUTING");
      expect(error?.errorCode).toBe("ROUTING_5003");
      expect(error?.message).toContain("common");
    });

    test("produces ROUTING_5003 for alignment incompatibility", () => {
      const requesting = {
        nodeId: "node-1",
        supportedIntents: ["QUERY"],
        alignmentCompatible: false, // Not compatible
        autonomyLevel: "FULL" as const,
        syncCapabilities: [],
      };

      const target = {
        nodeId: "node-2",
        supportedIntents: ["QUERY"],
        alignmentCompatible: true,
        autonomyLevel: "FULL" as const,
        syncCapabilities: [],
      };

      const negotiation = negotiateCapabilities(requesting, target);

      expect(negotiation.compatible).toBe(false);

      const handshakeResponse = {
        success: false,
        verified: true,
        compatible: false,
        error: negotiation.error,
      };

      const error = federationFailureToError(handshakeResponse, correlationId);

      expect(error?.errorClass).toBe("ERROR.ROUTING");
      expect(error?.errorCode).toBe("ROUTING_5003");
    });

    test("produces ROUTING_5003 for autonomy level incompatibility", () => {
      const requesting = {
        nodeId: "node-1",
        supportedIntents: ["QUERY"],
        alignmentCompatible: true,
        autonomyLevel: "FULL" as const,
        syncCapabilities: [],
      };

      const target = {
        nodeId: "node-2",
        supportedIntents: ["QUERY"],
        alignmentCompatible: true,
        autonomyLevel: "NONE" as const, // No autonomy
        syncCapabilities: [],
      };

      const negotiation = negotiateCapabilities(requesting, target);

      expect(negotiation.compatible).toBe(false);

      const handshakeResponse = {
        success: false,
        verified: true,
        compatible: false,
        error: negotiation.error,
      };

      const error = federationFailureToError(handshakeResponse, correlationId);

      expect(error?.errorClass).toBe("ERROR.ROUTING");
      expect(error?.errorCode).toBe("ROUTING_5003");
    });
  });

  describe("Agent Execution Routing Failures", () => {
    test("produces ROUTING_5001 for agent invoked outside MCP", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          caller: {
            nodeId: "local",
            moduleId: "TKD", // Not MCP
          },
        },
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-schema",
          schemaVersion: "1.0",
          content: {
            taskScope: "test-task",
            reversible: true,
          },
        },
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: true,
      };

      const validation = validateAgentExecution(request);

      expect(validation.valid).toBe(false);

      const error = agentExecutionFailureToError(validation, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.ROUTING");
      expect(error?.errorCode).toBe("ROUTING_5001");
      expect(error?.message).toContain("MCP");
    });

    test("produces VALIDATION_2002 for missing task scope", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-schema",
          schemaVersion: "1.0",
          content: {
            reversible: true,
          },
        },
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "", // Empty task scope
        reversible: true,
      };

      const validation = validateAgentExecution(request);

      expect(validation.valid).toBe(false);

      const error = agentExecutionFailureToError(validation, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.VALIDATION");
      expect(error?.errorCode).toBe("VALIDATION_2002");
      expect(error?.message).toContain("task scope");
    });

    test("produces CONSTITUTIONAL_7002 for non-reversible agent execution", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "agent-schema",
          schemaVersion: "1.0",
          content: {
            taskScope: "test-task",
            // Missing reversible flag and not constitutional
          },
        },
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: false, // Not reversible
      };

      const validation = validateAgentExecution(request);

      expect(validation.valid).toBe(false);

      const error = agentExecutionFailureToError(validation, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error?.errorCode).toBe("CONSTITUTIONAL_7002");
      expect(error?.message).toContain("reversible");
    });

    test("produces CONSTITUTIONAL_7001 for agent attempting to modify LDS", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "agent-schema",
          schemaVersion: "1.0",
          content: {
            taskScope: "test-task",
            target: "LDS", // Agents cannot modify LDS
            reversible: true,
          },
        },
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: true,
      };

      const validation = validateAgentExecution(request);

      expect(validation.valid).toBe(false);

      const error = agentExecutionFailureToError(validation, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error?.errorCode).toBe("CONSTITUTIONAL_7001");
      expect(error?.message).toContain("LDS");
    });

    test("produces CONSTITUTIONAL_7001 for agent attempting to modify KG", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "agent-schema",
          schemaVersion: "1.0",
          content: {
            taskScope: "test-task",
            target: "KG", // Agents cannot modify KG
            reversible: true,
          },
        },
      };

      const request: AgentExecutionRequest = {
        message,
        agentId: "agent-1",
        taskScope: "test-task",
        reversible: true,
      };

      const validation = validateAgentExecution(request);

      expect(validation.valid).toBe(false);

      const error = agentExecutionFailureToError(validation, correlationId);

      expect(error?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error?.errorCode).toBe("CONSTITUTIONAL_7001");
      expect(error?.message).toContain("KG");
    });
  });

  describe("Alignment Routing Failures", () => {
    test("produces ALIGNMENT_6002 for mediator halt", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            reversible: true,
          },
        },
      };

      const request: AlignmentReviewRequest = {
        message,
        from: "MCP",
        to: "AGENTS",
        requiresReview: true,
      };

      // Mock alignment review that returns mediator halt
      const alignmentResult = {
        approved: false,
        actor: "MEDIATOR" as const,
        halt: true,
        explanation: "Message halted by Mediator due to high risk",
      };

      const error = alignmentFailureToError(alignmentResult, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.ALIGNMENT");
      expect(error?.errorCode).toBe("ALIGNMENT_6002");
      expect(error?.severity).toBe("HIGH");
      expect(error?.details).toEqual({ actor: "MEDIATOR" });
    });

    test("produces ALIGNMENT_6001 for judge rejection", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "KG_MUTATION_PROPOSAL",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            reversible: true,
          },
        },
      };

      const alignmentResult = {
        approved: false,
        actor: "JUDGE" as const,
        explanation: "Message rejected by Judge: violates alignment constraints",
      };

      const error = alignmentFailureToError(alignmentResult, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.ALIGNMENT");
      expect(error?.errorCode).toBe("ALIGNMENT_6001");
      expect(error?.details).toEqual({ actor: "JUDGE" });
    });

    test("produces ALIGNMENT_6001 for generic alignment rejection", async () => {
      const alignmentResult = {
        approved: false,
        actor: "ACTOR" as const,
        explanation: "Alignment review failed",
      };

      const error = alignmentFailureToError(alignmentResult, correlationId);

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.ALIGNMENT");
      expect(error?.errorCode).toBe("ALIGNMENT_6001");
    });

    test("produces no error for approved alignment review", async () => {
      const alignmentResult = {
        approved: true,
        actor: "ACTOR" as const,
        explanation: "Approved",
      };

      const error = alignmentFailureToError(alignmentResult, correlationId);

      expect(error).toBeNull();
    });
  });

  describe("Error Context Preservation", () => {
    test("preserves federation failure details in error", () => {
      const handshakeResponse = {
        success: false,
        verified: false,
        compatible: false,
        error: "Node identity verification failed",
      };

      const error = federationFailureToError(handshakeResponse, correlationId);

      expect(error?.details).toEqual({ verified: false });
    });

    test("preserves agent execution details in error", () => {
      const validation = {
        valid: false,
        error: "Agents can only be invoked via MCP",
      };

      const error = agentExecutionFailureToError(validation, correlationId);

      expect(error?.details).toEqual({ subsystem: "AGENTS" });
    });

    test("preserves alignment actor in error details", () => {
      const alignmentResult = {
        approved: false,
        actor: "MEDIATOR" as const,
        halt: true,
        explanation: "Halted",
      };

      const error = alignmentFailureToError(alignmentResult, correlationId);

      expect(error?.details).toEqual({ actor: "MEDIATOR" });
    });
  });
});
