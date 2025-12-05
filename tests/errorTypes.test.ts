/**
 * Tests for MCP v1.1 Error Type Construction
 * 
 * Covers: Construction of each MCP error type with proper error codes,
 * severity levels, retry information, and context.
 */

import {
  createTransportError,
  createValidationError,
  createAuthError,
  createSafetyError,
  createRoutingError,
  createAlignmentError,
  createConstitutionalError,
  createInternalError,
  createErrorBody,
} from "../mcp/src/core/error";
import { MCPErrorBody, MCPErrorCode } from "../mcp/src/core/types";

describe("MCP v1.1 Error Type Construction", () => {
  const correlationId = "test-correlation-123";

  describe("Transport Errors", () => {
    test("creates TRANSPORT_1001 (Connection failed)", () => {
      const error = createTransportError(
        "Connection failed to remote node",
        correlationId,
        "TRANSPORT_1001",
        { nodeId: "remote-1", port: 8080 }
      );

      expect(error.errorClass).toBe("ERROR.TRANSPORT");
      expect(error.errorCode).toBe("TRANSPORT_1001");
      expect(error.message).toBe("Connection failed to remote node");
      expect(error.severity).toBe("MEDIUM");
      expect(error.retry?.retryable).toBe(true);
      expect(error.details).toEqual({ nodeId: "remote-1", port: 8080 });
    });

    test("creates TRANSPORT_1002 (Timeout)", () => {
      const error = createTransportError(
        "Request timeout",
        correlationId,
        "TRANSPORT_1002"
      );
      expect(error.errorCode).toBe("TRANSPORT_1002");
      expect(error.retry?.retryable).toBe(true);
    });

    test("creates TRANSPORT_1003 (Network unreachable)", () => {
      const error = createTransportError(
        "Network unreachable",
        correlationId,
        "TRANSPORT_1003"
      );
      expect(error.errorCode).toBe("TRANSPORT_1003");
    });

    test("creates TRANSPORT_1004 (Protocol violation)", () => {
      const error = createTransportError(
        "Protocol violation detected",
        correlationId,
        "TRANSPORT_1004"
      );
      expect(error.errorCode).toBe("TRANSPORT_1004");
    });

    test("creates TRANSPORT_1005 (Serialization error)", () => {
      const error = createTransportError(
        "Serialization failed",
        correlationId,
        "TRANSPORT_1005"
      );
      expect(error.errorCode).toBe("TRANSPORT_1005");
    });
  });

  describe("Validation Errors", () => {
    test("creates VALIDATION_2001 (Schema validation failed)", () => {
      const error = createValidationError(
        "Schema validation failed",
        correlationId,
        "VALIDATION_2001",
        { schema: "test-schema", errors: ["missing field: id"] }
      );

      expect(error.errorClass).toBe("ERROR.VALIDATION");
      expect(error.errorCode).toBe("VALIDATION_2001");
      expect(error.severity).toBe("LOW");
      expect(error.retry?.retryable).toBe(false);
    });

    test("creates VALIDATION_2002 (Missing required field)", () => {
      const error = createValidationError(
        "Missing required field: nodeId",
        correlationId,
        "VALIDATION_2002"
      );
      expect(error.errorCode).toBe("VALIDATION_2002");
    });

    test("creates VALIDATION_2003 (Invalid field value)", () => {
      const error = createValidationError(
        "Invalid field value",
        correlationId,
        "VALIDATION_2003"
      );
      expect(error.errorCode).toBe("VALIDATION_2003");
    });

    test("creates VALIDATION_2004 (Type mismatch)", () => {
      const error = createValidationError(
        "Type mismatch: expected string, got number",
        correlationId,
        "VALIDATION_2004"
      );
      expect(error.errorCode).toBe("VALIDATION_2004");
    });

    test("creates VALIDATION_2005 (Constraint violation)", () => {
      const error = createValidationError(
        "Constraint violation",
        correlationId,
        "VALIDATION_2005"
      );
      expect(error.errorCode).toBe("VALIDATION_2005");
    });
  });

  describe("Auth Errors", () => {
    test("creates AUTH_3001 (Authentication failed)", () => {
      const error = createAuthError(
        "Authentication failed",
        correlationId,
        "AUTH_3001"
      );

      expect(error.errorClass).toBe("ERROR.AUTH");
      expect(error.errorCode).toBe("AUTH_3001");
      expect(error.severity).toBe("HIGH");
      expect(error.retry?.retryable).toBe(false);
    });

    test("creates AUTH_3002 (Authorization denied)", () => {
      const error = createAuthError(
        "Authorization denied",
        correlationId,
        "AUTH_3002"
      );
      expect(error.errorCode).toBe("AUTH_3002");
    });

    test("creates AUTH_3003 (Invalid credentials)", () => {
      const error = createAuthError(
        "Invalid credentials",
        correlationId,
        "AUTH_3003"
      );
      expect(error.errorCode).toBe("AUTH_3003");
    });

    test("creates AUTH_3004 (Token expired)", () => {
      const error = createAuthError(
        "Token expired",
        correlationId,
        "AUTH_3004"
      );
      expect(error.errorCode).toBe("AUTH_3004");
    });

    test("creates AUTH_3005 (Insufficient capabilities)", () => {
      const error = createAuthError(
        "Insufficient capabilities",
        correlationId,
        "AUTH_3005"
      );
      expect(error.errorCode).toBe("AUTH_3005");
    });
  });

  describe("Safety Errors", () => {
    test("creates SAFETY_4001 (Risk level exceeded)", () => {
      const error = createSafetyError(
        "Risk level exceeded threshold",
        correlationId,
        "SAFETY_4001"
      );

      expect(error.errorClass).toBe("ERROR.SAFETY");
      expect(error.errorCode).toBe("SAFETY_4001");
      expect(error.severity).toBe("CRITICAL");
      expect(error.retry?.retryable).toBe(false);
    });

    test("creates SAFETY_4002 (Alignment violation)", () => {
      const error = createSafetyError(
        "Alignment violation detected",
        correlationId,
        "SAFETY_4002"
      );
      expect(error.errorCode).toBe("SAFETY_4002");
    });

    test("creates SAFETY_4003 (Constitutional constraint violated)", () => {
      const error = createSafetyError(
        "Constitutional constraint violated",
        correlationId,
        "SAFETY_4003"
      );
      expect(error.errorCode).toBe("SAFETY_4003");
    });

    test("creates SAFETY_4004 (Snapshot scope violation)", () => {
      const error = createSafetyError(
        "Snapshot scope violation",
        correlationId,
        "SAFETY_4004"
      );
      expect(error.errorCode).toBe("SAFETY_4004");
    });

    test("creates SAFETY_4005 (Reversibility check failed)", () => {
      const error = createSafetyError(
        "Reversibility check failed",
        correlationId,
        "SAFETY_4005"
      );
      expect(error.errorCode).toBe("SAFETY_4005");
    });
  });

  describe("Routing Errors", () => {
    test("creates ROUTING_5001 (Illegal route)", () => {
      const error = createRoutingError(
        "Illegal route: AGENTS → KG",
        correlationId,
        "ROUTING_5001",
        { from: "AGENTS", to: "KG", intent: "UPDATE" }
      );

      expect(error.errorClass).toBe("ERROR.ROUTING");
      expect(error.errorCode).toBe("ROUTING_5001");
      expect(error.severity).toBe("MEDIUM");
      expect(error.retry?.retryable).toBe(true);
    });

    test("creates ROUTING_5002 (Target module not found)", () => {
      const error = createRoutingError(
        "Target module not found",
        correlationId,
        "ROUTING_5002"
      );
      expect(error.errorCode).toBe("ROUTING_5002");
    });

    test("creates ROUTING_5003 (Route blocked by policy)", () => {
      const error = createRoutingError(
        "Route blocked by policy",
        correlationId,
        "ROUTING_5003"
      );
      expect(error.errorCode).toBe("ROUTING_5003");
    });

    test("creates ROUTING_5004 (Circular routing detected)", () => {
      const error = createRoutingError(
        "Circular routing detected",
        correlationId,
        "ROUTING_5004"
      );
      expect(error.errorCode).toBe("ROUTING_5004");
    });
  });

  describe("Alignment Errors", () => {
    test("creates ALIGNMENT_6001 (Judge ruling rejected)", () => {
      const error = createAlignmentError(
        "Judge ruling rejected",
        correlationId,
        "ALIGNMENT_6001"
      );

      expect(error.errorClass).toBe("ERROR.ALIGNMENT");
      expect(error.errorCode).toBe("ALIGNMENT_6001");
      expect(error.severity).toBe("HIGH");
      expect(error.retry?.retryable).toBe(false);
    });

    test("creates ALIGNMENT_6002 (Mediator halt)", () => {
      const error = createAlignmentError(
        "Message halted by Mediator",
        correlationId,
        "ALIGNMENT_6002"
      );
      expect(error.errorCode).toBe("ALIGNMENT_6002");
    });

    test("creates ALIGNMENT_6003 (Value conflict detected)", () => {
      const error = createAlignmentError(
        "Value conflict detected",
        correlationId,
        "ALIGNMENT_6003"
      );
      expect(error.errorCode).toBe("ALIGNMENT_6003");
    });

    test("creates ALIGNMENT_6004 (Goal drift detected)", () => {
      const error = createAlignmentError(
        "Goal drift detected",
        correlationId,
        "ALIGNMENT_6004"
      );
      expect(error.errorCode).toBe("ALIGNMENT_6004");
    });
  });

  describe("Constitutional Errors", () => {
    test("creates CONSTITUTIONAL_7001 (Sovereignty violation)", () => {
      const error = createConstitutionalError(
        "Sovereignty violation detected",
        correlationId,
        "CONSTITUTIONAL_7001"
      );

      expect(error.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error.errorCode).toBe("CONSTITUTIONAL_7001");
      expect(error.severity).toBe("CRITICAL");
      expect(error.retry?.retryable).toBe(false);
    });

    test("creates CONSTITUTIONAL_7002 (Non-coercion violation)", () => {
      const error = createConstitutionalError(
        "Non-coercion violation",
        correlationId,
        "CONSTITUTIONAL_7002"
      );
      expect(error.errorCode).toBe("CONSTITUTIONAL_7002");
    });

    test("creates CONSTITUTIONAL_7003 (Locality violation)", () => {
      const error = createConstitutionalError(
        "Locality violation",
        correlationId,
        "CONSTITUTIONAL_7003"
      );
      expect(error.errorCode).toBe("CONSTITUTIONAL_7003");
    });

    test("creates CONSTITUTIONAL_7004 (Observability violation)", () => {
      const error = createConstitutionalError(
        "Observability violation",
        correlationId,
        "CONSTITUTIONAL_7004"
      );
      expect(error.errorCode).toBe("CONSTITUTIONAL_7004");
    });
  });

  describe("Internal Errors", () => {
    test("creates INTERNAL_8001 (Unexpected error)", () => {
      const error = createInternalError(
        "Unexpected internal error",
        correlationId,
        "INTERNAL_8001"
      );

      expect(error.errorClass).toBe("ERROR.INTERNAL");
      expect(error.errorCode).toBe("INTERNAL_8001");
      expect(error.severity).toBe("HIGH");
      expect(error.retry?.retryable).toBe(true);
    });

    test("creates INTERNAL_8002 (Resource exhausted)", () => {
      const error = createInternalError(
        "Resource exhausted",
        correlationId,
        "INTERNAL_8002"
      );
      expect(error.errorCode).toBe("INTERNAL_8002");
    });

    test("creates INTERNAL_8003 (State corruption)", () => {
      const error = createInternalError(
        "State corruption detected",
        correlationId,
        "INTERNAL_8003"
      );
      expect(error.errorCode).toBe("INTERNAL_8003");
    });

    test("creates INTERNAL_8004 (Configuration error)", () => {
      const error = createInternalError(
        "Configuration error",
        correlationId,
        "INTERNAL_8004"
      );
      expect(error.errorCode).toBe("INTERNAL_8004");
    });

    test("creates INTERNAL_8005 (Dependency failure)", () => {
      const error = createInternalError(
        "Dependency failure",
        correlationId,
        "INTERNAL_8005"
      );
      expect(error.errorCode).toBe("INTERNAL_8005");
    });

    test("creates internal error with cause chain", () => {
      const error = createInternalError(
        "Internal error with cause",
        correlationId,
        "INTERNAL_8001",
        undefined,
        {
          errorCode: "VALIDATION_2001",
          message: "Root cause: validation failed",
        }
      );

      expect(error.cause).toBeDefined();
      expect(error.cause?.errorCode).toBe("VALIDATION_2001");
      expect(error.cause?.message).toBe("Root cause: validation failed");
    });
  });

  describe("Error with Context", () => {
    test("creates error with full context information", () => {
      const error = createErrorBody(
        "ERROR.ROUTING",
        "Routing failed",
        correlationId,
        { route: "AGENTS → KG" },
        {
          errorCode: "ROUTING_5001",
          severity: "HIGH",
          context: {
            moduleId: "router-module",
            agentId: "router-agent",
            operation: "routeMessage",
            stackTrace: "at Router.routeMessage(...)",
            additionalData: {
              from: "AGENTS",
              to: "KG",
            },
          },
          retry: {
            retryable: false,
          },
        }
      );

      expect(error.context?.moduleId).toBe("router-module");
      expect(error.context?.agentId).toBe("router-agent");
      expect(error.context?.operation).toBe("routeMessage");
      expect(error.context?.stackTrace).toBeDefined();
      expect(error.context?.additionalData).toEqual({
        from: "AGENTS",
        to: "KG",
      });
    });
  });

  describe("Error Code Validation", () => {
    test("throws error for invalid error code", () => {
      expect(() => {
        createErrorBody(
          "ERROR.VALIDATION",
          "Test",
          correlationId,
          undefined,
          { errorCode: "TRANSPORT_1001" as MCPErrorCode } // Wrong code
        );
      }).toThrow("Error code TRANSPORT_1001 does not match error class ERROR.VALIDATION");
    });
  });
});
