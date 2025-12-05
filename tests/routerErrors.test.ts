/**
 * Tests for MCP v1.1 Router Error Propagation
 * 
 * Covers: Router should return typed MCP errors when routing fails.
 * Tests that router errors can be properly converted to MCP error bodies.
 */

import { routeMessage, RouterContext, RoutingResult } from "../src/mcp/core/router";
import {
  MCPMessage,
  MessageContext,
} from "../src/mcp/core/message";
import { Subsystem } from "../src/mcp/core/routing";
import {
  createRoutingError,
  createAlignmentError,
  createConstitutionalError,
  createInternalError,
} from "../mcp/src/core/error";
import { MCPErrorBody } from "../mcp/src/core/types";

/**
 * Helper function to convert router result to MCP error body
 * This demonstrates how router errors should be surfaced as MCP errors
 */
function routerResultToError(
  result: RoutingResult,
  correlationId: string,
  from: Subsystem,
  to: Subsystem
): MCPErrorBody | null {
  if (result.success || !result.error) {
    return null;
  }

  // Illegal route errors
  if (result.error.includes("Illegal route")) {
    return createRoutingError(
      result.error,
      correlationId,
      "ROUTING_5001",
      { from, to }
    );
  }

  // Constraint violation errors
  if (result.constraintResult && !result.constraintResult.valid) {
    const violations = result.constraintResult.violations;
    if (violations.includes("NON_COERCION_VIOLATION")) {
      return createConstitutionalError(
        result.error || "Non-coercion violation",
        correlationId,
        "CONSTITUTIONAL_7002",
        { violations }
      );
    }
    if (violations.includes("LOCALITY_VIOLATION")) {
      return createConstitutionalError(
        result.error || "Locality violation",
        correlationId,
        "CONSTITUTIONAL_7003",
        { violations }
      );
    }
    if (violations.includes("REVERSIBILITY_VIOLATION")) {
      return createConstitutionalError(
        result.error || "Reversibility violation",
        correlationId,
        "CONSTITUTIONAL_7002",
        { violations }
      );
    }
    if (violations.includes("OBSERVABILITY_VIOLATION")) {
      return createConstitutionalError(
        result.error || "Observability violation",
        correlationId,
        "CONSTITUTIONAL_7004",
        { violations }
      );
    }
    // Generic constraint violation
    return createConstitutionalError(
      result.error || "Constitutional constraint violated",
      correlationId,
      "CONSTITUTIONAL_7001",
      { violations }
    );
  }

  // Alignment/Mediator halt errors
  if (result.halted && result.alignmentResult) {
    if (result.error?.includes("Mediator")) {
      return createAlignmentError(
        result.error,
        correlationId,
        "ALIGNMENT_6002",
        { alignmentResult: result.alignmentResult }
      );
    }
    if (result.error?.includes("Alignment") || result.error?.includes("rejected")) {
      return createAlignmentError(
        result.error || "Message rejected by Alignment",
        correlationId,
        "ALIGNMENT_6001",
        { alignmentResult: result.alignmentResult }
      );
    }
  }

  // Internal errors (from route handler exceptions)
  // If routed is false but we got past constraint checks, it's likely a route handler failure
  if (!result.routed && result.constraintResult?.valid !== false && !result.halted) {
    return createInternalError(
      result.error || "Internal routing error",
      correlationId,
      "INTERNAL_8001",
      { from, to, routed: result.routed, halted: result.halted }
    );
  }

  // Generic routing failure
  if (!result.routed) {
    return createRoutingError(
      result.error || "Routing failed",
      correlationId,
      "ROUTING_5002",
      { from, to }
    );
  }

  // Fallback internal error
  return createInternalError(
    result.error || "Internal routing error",
    correlationId,
    "INTERNAL_8001",
    { from, to, routed: result.routed, halted: result.halted }
  );
}

describe("Router Error Propagation", () => {
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

  const createTestMessage = (intent: string): MCPMessage => ({
    context: createTestContext(),
    intent: intent as any,
    payload: {
      schema: "test-schema",
      schemaVersion: "1.0",
      content: {
        reversible: true,
      },
    },
  });

  const correlationId = "test-correlation-router";

  describe("Illegal Route Errors", () => {
    test("converts illegal route error to ROUTING_5001", async () => {
      const message = createTestMessage("UPDATE");
      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {},
      };

      const result = await routeMessage(message, "AGENTS", "KG", ctx);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Illegal route");

      const mcpError = routerResultToError(result, correlationId, "AGENTS", "KG");
      expect(mcpError).not.toBeNull();
      expect(mcpError?.errorClass).toBe("ERROR.ROUTING");
      expect(mcpError?.errorCode).toBe("ROUTING_5001");
      expect(mcpError?.message).toContain("Illegal route");
    });

    test("converts TKD → AGENTS illegal route to routing error", async () => {
      const message = createTestMessage("AGENT_EXECUTION");
      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {},
      };

      const result = await routeMessage(message, "TKD", "AGENTS", ctx);

      expect(result.success).toBe(false);
      const mcpError = routerResultToError(result, correlationId, "TKD", "AGENTS");
      expect(mcpError?.errorClass).toBe("ERROR.ROUTING");
      expect(mcpError?.errorCode).toBe("ROUTING_5001");
    });
  });

  describe("Constraint Violation Errors", () => {
    test("converts non-coercion violation to CONSTITUTIONAL_7002", async () => {
      // Non-coercion violation requires UPDATE intent and reducePermissions flag
      // But UPDATE is not a legal route for MCP → CRYSTALLINE
      // So we test the constraint validation directly instead
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE", // Required for reducePermissions check
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            reducePermissions: true, // This triggers non-coercion violation
            reversible: true,
          },
        },
      };

      // Test constraint validation directly since UPDATE isn't a legal route
      const { validateConstitutionalConstraints } = require("../src/mcp/core/constraints");
      const constraintResult = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");
      
      expect(constraintResult.valid).toBe(false);
      expect(constraintResult.violations).toContain("NON_COERCION_VIOLATION");

      const mcpError = routerResultToError(
        { success: false, routed: false, halted: true, constraintResult, error: constraintResult.explanation },
        correlationId,
        "MCP",
        "CRYSTALLINE"
      );
      expect(mcpError).not.toBeNull();
      expect(mcpError?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(mcpError?.errorCode).toBe("CONSTITUTIONAL_7002");
    });

    test("converts locality violation to CONSTITUTIONAL_7003", async () => {
      // Locality violation requires UPDATE intent, external node, and override flag
      // But UPDATE is not a legal route for MCP → ALIGNMENT
      // So we test the constraint validation directly instead
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          caller: {
            nodeId: "external-node",
            moduleId: "external-module",
          },
        },
        intent: "UPDATE", // Required for locality violation check
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            override: true,
            reversible: true,
          },
        },
      };

      // Test constraint validation directly since UPDATE isn't a legal route
      const { validateConstitutionalConstraints } = require("../src/mcp/core/constraints");
      const constraintResult = validateConstitutionalConstraints(message, "MCP", "ALIGNMENT");
      
      expect(constraintResult.valid).toBe(false);
      expect(constraintResult.violations).toContain("LOCALITY_VIOLATION");

      const mcpError = routerResultToError(
        { success: false, routed: false, halted: true, constraintResult, error: constraintResult.explanation },
        correlationId,
        "MCP",
        "ALIGNMENT"
      );
      expect(mcpError).not.toBeNull();
      expect(mcpError?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(mcpError?.errorCode).toBe("CONSTITUTIONAL_7003");
    });

    test("converts reversibility violation to CONSTITUTIONAL error", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "KG_MUTATION_PROPOSAL",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            // Missing reversible flag
          },
        },
      };

      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {},
      };

      const result = await routeMessage(message, "MCP", "CRYSTALLINE", ctx);

      expect(result.success).toBe(false);
      expect(result.constraintResult?.violations).toContain("REVERSIBILITY_VIOLATION");

      const mcpError = routerResultToError(result, correlationId, "MCP", "CRYSTALLINE");
      expect(mcpError?.errorClass).toBe("ERROR.CONSTITUTIONAL");
    });

    test("converts observability violation to CONSTITUTIONAL_7004", async () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          provenance: [], // Missing provenance triggers observability violation
        },
        intent: "QUERY",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            reversible: true,
          },
        },
      };

      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {},
      };

      const result = await routeMessage(message, "MCP", "CRYSTALLINE", ctx);

      expect(result.success).toBe(false);
      expect(result.constraintResult?.violations).toContain("OBSERVABILITY_VIOLATION");

      const mcpError = routerResultToError(result, correlationId, "MCP", "CRYSTALLINE");
      expect(mcpError?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(mcpError?.errorCode).toBe("CONSTITUTIONAL_7004");
    });
  });

  describe("Alignment/Mediator Halt Errors", () => {
    test("converts mediator halt to ALIGNMENT_6002", async () => {
      const message = createTestMessage("AGENT_EXECUTION");
      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {},
        alignmentHandler: async () => ({
          approved: false,
          actor: "MEDIATOR",
          halt: true,
          explanation: "Message halted by Mediator",
        }),
      };

      const result = await routeMessage(message, "MCP", "AGENTS", ctx);

      expect(result.success).toBe(false);
      expect(result.halted).toBe(true);
      expect(result.error).toContain("Mediator");

      const mcpError = routerResultToError(result, correlationId, "MCP", "AGENTS");
      expect(mcpError).not.toBeNull();
      expect(mcpError?.errorClass).toBe("ERROR.ALIGNMENT");
      expect(mcpError?.errorCode).toBe("ALIGNMENT_6002");
    });

    test("converts alignment rejection to ALIGNMENT_6001", async () => {
      const message = createTestMessage("AGENT_EXECUTION");
      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {},
        alignmentHandler: async () => ({
          approved: false,
          actor: "JUDGE",
          explanation: "Message rejected by Alignment",
        }),
      };

      const result = await routeMessage(message, "MCP", "AGENTS", ctx);

      expect(result.success).toBe(false);
      expect(result.halted).toBe(true);

      const mcpError = routerResultToError(result, correlationId, "MCP", "AGENTS");
      expect(mcpError?.errorClass).toBe("ERROR.ALIGNMENT");
      expect(mcpError?.errorCode).toBe("ALIGNMENT_6001");
    });
  });

  describe("Route Handler Failure Errors", () => {
    test("converts route handler exception to INTERNAL_8001", async () => {
      const message = createTestMessage("QUERY");
      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {
          throw new Error("Target subsystem unavailable");
        },
      };

      const result = await routeMessage(message, "MCP", "CRYSTALLINE", ctx);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Target subsystem unavailable");

      const mcpError = routerResultToError(result, correlationId, "MCP", "CRYSTALLINE");
      expect(mcpError).not.toBeNull();
      expect(mcpError?.errorClass).toBe("ERROR.INTERNAL");
      expect(mcpError?.errorCode).toBe("INTERNAL_8001");
      expect(mcpError?.details).toEqual({
        from: "MCP",
        to: "CRYSTALLINE",
        routed: false,
        halted: false,
      });
    });

    test("converts route handler timeout to routing error", async () => {
      const message = createTestMessage("QUERY");
      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {
          throw new Error("Route handler timeout");
        },
      };

      const result = await routeMessage(message, "MCP", "CRYSTALLINE", ctx);

      const mcpError = routerResultToError(result, correlationId, "MCP", "CRYSTALLINE");
      expect(mcpError?.errorClass).toBe("ERROR.INTERNAL");
    });
  });

  describe("Error Context Preservation", () => {
    test("preserves constraint violations in error details", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE", // Required for reducePermissions check
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            reducePermissions: true,
            reversible: true,
          },
        },
      };

      // Test constraint validation directly
      const { validateConstitutionalConstraints } = require("../src/mcp/core/constraints");
      const constraintResult = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");
      
      const result = {
        success: false,
        routed: false,
        halted: true,
        constraintResult,
        error: constraintResult.explanation,
      };
      
      expect(result.constraintResult).toBeDefined();
      const mcpError = routerResultToError(result, correlationId, "MCP", "CRYSTALLINE");

      expect(mcpError).not.toBeNull();
      expect(mcpError?.details).toBeDefined();
      const details = mcpError?.details as { violations?: string[] };
      expect(details.violations).toContain("NON_COERCION_VIOLATION");
    });

    test("preserves alignment result in error details", async () => {
      const message = createTestMessage("AGENT_EXECUTION");
      const ctx: RouterContext = {
        currentNodeId: "local",
        routeHandler: async () => {},
        alignmentHandler: async () => ({
          approved: false,
          actor: "MEDIATOR",
          halt: true,
          explanation: "Halted",
        }),
      };

      const result = await routeMessage(message, "MCP", "AGENTS", ctx);
      const mcpError = routerResultToError(result, correlationId, "MCP", "AGENTS");

      expect(mcpError?.details).toBeDefined();
      const details = mcpError?.details as { alignmentResult?: any };
      expect(details.alignmentResult).toBeDefined();
      expect(details.alignmentResult?.actor).toBe("MEDIATOR");
    });
  });
});
