/**
 * Tests for MCP v1.1 Constitutional Constraints
 */

import {
  validateConstitutionalConstraints,
  ConstraintViolation
} from "../src/mcp/core/constraints";
import { MCPMessage, MessageContext, MessagePayload } from "../src/mcp/core/message";
import { Subsystem } from "../src/mcp/core/routing";

describe("Constitutional Constraints", () => {
  const createTestContext = (): MessageContext => ({
    caller: {
      nodeId: "local",
      moduleId: "test-module"
    },
    sessionId: "test-session",
    permissions: [],
    provenance: [
      {
        nodeId: "local",
        moduleId: "test-module",
        timestamp: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });

  const createValidMessage = (): MCPMessage => ({
    context: createTestContext(),
    intent: "QUERY",
    payload: {
      schema: "test-schema",
      schemaVersion: "1.0",
      content: {}
    }
  });

  describe("validateConstitutionalConstraints", () => {
    it("should pass valid message", () => {
      const message = createValidMessage();
      const result = validateConstitutionalConstraints(
        message,
        "MCP",
        "CRYSTALLINE"
      );

      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it("should detect non-coercion violations", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            reducePermissions: true // Force flag only works when routing TO MCP
          }
        }
      };

      const result = validateConstitutionalConstraints(
        message,
        "MCP",
        "CRYSTALLINE"
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("NON_COERCION_VIOLATION");
    });

    it("should detect locality violations", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          caller: {
            nodeId: "external-node",
            moduleId: "external-module"
          }
        },
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            override: true
          }
        }
      };

      const result = validateConstitutionalConstraints(
        message,
        "MCP",
        "ALIGNMENT"
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("LOCALITY_VIOLATION");
    });

    it("should detect reversibility violations", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "KG_MUTATION_PROPOSAL",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            // Missing reversible flag
          }
        }
      };

      const result = validateConstitutionalConstraints(
        message,
        "MCP",
        "CRYSTALLINE"
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("REVERSIBILITY_VIOLATION");
    });

    it("should allow constitutional changes without reversibility", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            constitutional: true
            // No reversible flag needed for constitutional changes
          }
        }
      };

      const result = validateConstitutionalConstraints(
        message,
        "MCP",
        "ALIGNMENT"
      );

      // Should not have reversibility violation
      expect(result.violations).not.toContain("REVERSIBILITY_VIOLATION");
    });

    it("should detect observability violations - missing provenance", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          provenance: []
        },
        intent: "QUERY",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {}
        }
      };

      const result = validateConstitutionalConstraints(
        message,
        "MCP",
        "CRYSTALLINE"
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("OBSERVABILITY_VIOLATION");
    });

    it("should detect observability violations - missing schema", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "QUERY",
        payload: {
          schema: "",
          schemaVersion: "1.0",
          content: {}
        }
      };

      const result = validateConstitutionalConstraints(
        message,
        "MCP",
        "CRYSTALLINE"
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("OBSERVABILITY_VIOLATION");
    });

    it("should detect observability violations - missing sessionId", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          sessionId: ""
        },
        intent: "QUERY",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {}
        }
      };

      const result = validateConstitutionalConstraints(
        message,
        "MCP",
        "CRYSTALLINE"
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("OBSERVABILITY_VIOLATION");
    });
  });
});
