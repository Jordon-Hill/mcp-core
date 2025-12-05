/**
 * Tests for MCP v1.1 Constraint Violation Errors
 * 
 * Covers: Constraint violations producing appropriate MCP errors.
 * Tests that each constraint violation type maps to correct MCP error codes.
 */

import { validateConstitutionalConstraints } from "../src/mcp/core/constraints";
import {
  MCPMessage,
  MessageContext,
} from "../src/mcp/core/message";
import {
  createConstitutionalError,
} from "../mcp/src/core/error";
import { ConstraintViolation } from "../src/mcp/core/constraints";

/**
 * Helper function to convert constraint violations to MCP error bodies
 */
function constraintViolationsToError(
  violations: ConstraintViolation[],
  explanation: string | undefined,
  correlationId: string
) {
  if (violations.length === 0) {
    return null;
  }

  // Map violations to error codes
  if (violations.includes("NON_COERCION_VIOLATION")) {
    return createConstitutionalError(
      explanation || "Non-coercion violation detected",
      correlationId,
      "CONSTITUTIONAL_7002",
      { violations }
    );
  }

  if (violations.includes("LOCALITY_VIOLATION")) {
    return createConstitutionalError(
      explanation || "Locality violation detected",
      correlationId,
      "CONSTITUTIONAL_7003",
      { violations }
    );
  }

  if (violations.includes("REVERSIBILITY_VIOLATION")) {
    return createConstitutionalError(
      explanation || "Reversibility violation detected",
      correlationId,
      "CONSTITUTIONAL_7002",
      { violations }
    );
  }

  if (violations.includes("OBSERVABILITY_VIOLATION")) {
    return createConstitutionalError(
      explanation || "Observability violation detected",
      correlationId,
      "CONSTITUTIONAL_7004",
      { violations }
    );
  }

  // Generic constitutional error
  return createConstitutionalError(
    explanation || "Constitutional constraint violated",
    correlationId,
    "CONSTITUTIONAL_7001",
    { violations }
  );
}

describe("Constraint Violation Errors", () => {
  const correlationId = "test-correlation-constraints";

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

  describe("Non-Coercion Violation Errors", () => {
    test("produces CONSTITUTIONAL_7002 for force flag violation", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            force: true, // Triggers non-coercion violation when routing to MCP
            reversible: true,
          },
        },
      };

      // Force flag violation only triggers when routing TO MCP
      const result = validateConstitutionalConstraints(message, "MCP", "MCP");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("NON_COERCION_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error?.errorCode).toBe("CONSTITUTIONAL_7002");
      expect(error?.severity).toBe("CRITICAL");
      expect(error?.details).toEqual({
        violations: ["NON_COERCION_VIOLATION"],
      });
    });

    test("produces CONSTITUTIONAL_7002 for reducePermissions violation", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            reducePermissions: true, // Triggers non-coercion violation
            reversible: true,
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("NON_COERCION_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error?.errorCode).toBe("CONSTITUTIONAL_7002");
    });
  });

  describe("Locality Violation Errors", () => {
    test("produces CONSTITUTIONAL_7003 for external override attempt", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          caller: {
            nodeId: "external-node",
            moduleId: "external-module",
          },
        },
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            override: true, // External node trying to override
            reversible: true,
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "ALIGNMENT");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("LOCALITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error?.errorCode).toBe("CONSTITUTIONAL_7003");
      expect(error?.severity).toBe("CRITICAL");
    });

    test("produces CONSTITUTIONAL_7003 for external node targeting MCP", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          caller: {
            nodeId: "external-node",
          },
        },
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            override: true,
            reversible: true,
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "MCP");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("LOCALITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error?.errorCode).toBe("CONSTITUTIONAL_7003");
    });
  });

  describe("Reversibility Violation Errors", () => {
    test("produces CONSTITUTIONAL_7002 for missing reversible flag on KG_MUTATION_PROPOSAL", () => {
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

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("REVERSIBILITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error?.errorCode).toBe("CONSTITUTIONAL_7002");
    });

    test("produces CONSTITUTIONAL_7002 for missing reversible flag on UPDATE", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            // Missing reversible flag
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("REVERSIBILITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error?.errorCode).toBe("CONSTITUTIONAL_7002");
    });

    test("produces CONSTITUTIONAL_7002 for missing reversible flag on AGENT_EXECUTION", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "AGENT_EXECUTION",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            // Missing reversible flag
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "AGENTS");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("REVERSIBILITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error?.errorCode).toBe("CONSTITUTIONAL_7002");
    });

    test("allows constitutional changes without reversible flag", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "KG_MUTATION_PROPOSAL",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            constitutional: true, // Constitutional changes don't need reversible flag
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      // Should not have reversibility violation
      expect(result.violations).not.toContain("REVERSIBILITY_VIOLATION");
    });
  });

  describe("Observability Violation Errors", () => {
    test("produces CONSTITUTIONAL_7004 for missing provenance", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          provenance: [], // Missing provenance
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

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("OBSERVABILITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error).not.toBeNull();
      expect(error?.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error?.errorCode).toBe("CONSTITUTIONAL_7004");
      expect(error?.severity).toBe("CRITICAL");
    });

    test("produces CONSTITUTIONAL_7004 for missing caller identity", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          caller: {
            nodeId: "", // Missing nodeId
          },
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

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("OBSERVABILITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error?.errorCode).toBe("CONSTITUTIONAL_7004");
    });

    test("produces CONSTITUTIONAL_7004 for missing sessionId", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          sessionId: "", // Missing sessionId
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

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("OBSERVABILITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error?.errorCode).toBe("CONSTITUTIONAL_7004");
    });

    test("produces CONSTITUTIONAL_7004 for missing schema declaration", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "QUERY",
        payload: {
          schema: "", // Missing schema
          schemaVersion: "1.0",
          content: {
            reversible: true,
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("OBSERVABILITY_VIOLATION");

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error?.errorCode).toBe("CONSTITUTIONAL_7004");
    });
  });

  describe("Multiple Constraint Violations", () => {
    test("produces error for multiple violations", () => {
      const message: MCPMessage = {
        context: {
          ...createTestContext(),
          provenance: [], // Observability violation
          caller: {
            nodeId: "external-node", // Locality violation
          },
        },
        intent: "UPDATE",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            force: true, // Non-coercion violation
            override: true, // Locality violation
            // Missing reversible flag
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error).not.toBeNull();
      expect(error?.details).toBeDefined();
      const details = error?.details as { violations?: ConstraintViolation[] };
      expect(details.violations?.length).toBeGreaterThan(1);
    });
  });

  describe("Valid Messages", () => {
    test("produces no error for valid message", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "QUERY",
        payload: {
          schema: "test-schema",
          schemaVersion: "1.0",
          content: {
            reversible: true,
          },
        },
      };

      const result = validateConstitutionalConstraints(message, "MCP", "CRYSTALLINE");

      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);

      const error = constraintViolationsToError(
        result.violations,
        result.explanation,
        correlationId
      );

      expect(error).toBeNull();
    });
  });
});
