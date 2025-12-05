import { MCPEnvelope, MCPIdentityRef, MCPErrorBody } from "../src/core/types";
import { MCPKeyring, NodeSigner, NodeVerifier } from "../src/identity/keyring";
import {
  buildErrorEnvelope,
  createErrorBody,
  createTransportError,
  createValidationError,
  createAuthError,
  createSafetyError,
  createRoutingError,
  createAlignmentError,
  createConstitutionalError,
  createInternalError,
} from "../src/core/error";
import { validateEnvelope } from "../src/core/validation";

function makeOriginal(): MCPEnvelope {
  return {
    header: {
      envelopeId: "orig-123",
      timestamp: new Date().toISOString(),
      version: "1.1.0",
      layer: "MCP-AGENT",
      type: "REQUEST",
      source: { nodeId: "n1" },
      target: { nodeId: "n2" },
      capabilities: { declared: [] },
    },
    body: { payloadType: "X", payload: {} },
    provenance: { route: [], hash: "h", signature: "s" },
    safety: { snapshotScope: "LIVE" },
  };
}

describe("MCP v1.1 Error Model", () => {
  let keyring: MCPKeyring;
  let signer: NodeSigner;
  let verifier: NodeVerifier;

  beforeEach(() => {
    keyring = new MCPKeyring();
    keyring.generateNodeKeys("n2");
    signer = new NodeSigner(keyring, "n2");
    verifier = new NodeVerifier(keyring);
  });

  describe("Error envelope builder", () => {
    test("constructs valid error envelope with v1.1 fields", () => {
      const original = makeOriginal();
      const emitting: MCPIdentityRef = { nodeId: "n2" };

      const err = buildErrorEnvelope(
        original,
        emitting,
        signer,
        "ERROR.INTERNAL",
        "Test error message",
        { info: 1 }
      );

      expect(() => validateEnvelope(err, verifier)).not.toThrow();
      expect(err.header.type).toBe("RESPONSE");
      expect(err.body.payloadType).toBe("MCP.ERROR");

      const errorPayload = err.body.payload as MCPErrorBody;
      expect(errorPayload.errorClass).toBe("ERROR.INTERNAL");
      expect(errorPayload.errorCode).toBe("INTERNAL_8001");
      expect(errorPayload.message).toBe("Test error message");
      expect(errorPayload.correlationId).toBe("orig-123");
      expect(errorPayload.severity).toBe("HIGH");
      expect(errorPayload.timestamp).toBeDefined();
      expect(errorPayload.retry).toBeDefined();
      expect(errorPayload.retry?.retryable).toBe(true);
    });

    test("includes error context from emitting identity", () => {
      const original = makeOriginal();
      const emitting: MCPIdentityRef = {
        nodeId: "n2",
        moduleId: "module-1",
        agentId: "agent-1",
      };

      const err = buildErrorEnvelope(
        original,
        emitting,
        signer,
        "ERROR.VALIDATION",
        "Validation failed"
      );

      const errorPayload = err.body.payload as MCPErrorBody;
      expect(errorPayload.context?.moduleId).toBe("module-1");
      expect(errorPayload.context?.agentId).toBe("agent-1");
    });

    test("allows custom error code and severity", () => {
      const original = makeOriginal();
      const emitting: MCPIdentityRef = { nodeId: "n2" };

      const err = buildErrorEnvelope(
        original,
        emitting,
        signer,
        "ERROR.VALIDATION",
        "Custom validation error",
        undefined,
        {
          errorCode: "VALIDATION_2003",
          severity: "MEDIUM",
        }
      );

      const errorPayload = err.body.payload as MCPErrorBody;
      expect(errorPayload.errorCode).toBe("VALIDATION_2003");
      expect(errorPayload.severity).toBe("MEDIUM");
    });

    test("includes error cause chain", () => {
      const original = makeOriginal();
      const emitting: MCPIdentityRef = { nodeId: "n2" };

      const err = buildErrorEnvelope(
        original,
        emitting,
        signer,
        "ERROR.INTERNAL",
        "Internal error with cause",
        undefined,
        {
          cause: {
            errorCode: "VALIDATION_2001",
            message: "Root cause: validation failed",
          },
        }
      );

      const errorPayload = err.body.payload as MCPErrorBody;
      expect(errorPayload.cause).toBeDefined();
      expect(errorPayload.cause?.errorCode).toBe("VALIDATION_2001");
      expect(errorPayload.cause?.message).toBe("Root cause: validation failed");
    });

    test("adjusts safety risk level based on error severity", () => {
      const original = makeOriginal();
      const emitting: MCPIdentityRef = { nodeId: "n2" };

      const criticalErr = buildErrorEnvelope(
        original,
        emitting,
        signer,
        "ERROR.SAFETY",
        "Critical safety error",
        undefined,
        { severity: "CRITICAL" }
      );

      expect(criticalErr.safety.riskLevel).toBe("CRITICAL");
    });
  });

  describe("createErrorBody", () => {
    test("creates error body with all v1.1 fields", () => {
      const errorBody = createErrorBody(
        "ERROR.TRANSPORT",
        "Transport error",
        "corr-123",
        { detail: "test" },
        {
          errorCode: "TRANSPORT_1002",
          severity: "MEDIUM",
          context: {
            moduleId: "transport-module",
            operation: "connect",
          },
          retry: {
            retryable: true,
            retryAfter: 5,
            maxRetries: 3,
            backoffStrategy: "exponential",
          },
        }
      );

      expect(errorBody.errorClass).toBe("ERROR.TRANSPORT");
      expect(errorBody.errorCode).toBe("TRANSPORT_1002");
      expect(errorBody.message).toBe("Transport error");
      expect(errorBody.correlationId).toBe("corr-123");
      expect(errorBody.severity).toBe("MEDIUM");
      expect(errorBody.details).toEqual({ detail: "test" });
      expect(errorBody.context?.moduleId).toBe("transport-module");
      expect(errorBody.context?.operation).toBe("connect");
      expect(errorBody.retry?.retryable).toBe(true);
      expect(errorBody.retry?.retryAfter).toBe(5);
      expect(errorBody.timestamp).toBeDefined();
    });

    test("uses default values when options not provided", () => {
      const errorBody = createErrorBody(
        "ERROR.VALIDATION",
        "Validation error",
        "corr-456"
      );

      expect(errorBody.errorCode).toBe("VALIDATION_2001");
      expect(errorBody.severity).toBe("LOW");
      expect(errorBody.retry?.retryable).toBe(false);
      expect(errorBody.timestamp).toBeDefined();
    });

    test("throws error for invalid error code", () => {
      expect(() => {
        createErrorBody(
          "ERROR.VALIDATION",
          "Test",
          "corr-123",
          undefined,
          { errorCode: "TRANSPORT_1001" } // Wrong code for VALIDATION class
        );
      }).toThrow("Error code TRANSPORT_1001 does not match error class ERROR.VALIDATION");
    });
  });

  describe("Convenience error creation functions", () => {
    test("createTransportError", () => {
      const error = createTransportError(
        "Connection failed",
        "corr-1",
        "TRANSPORT_1001"
      );
      expect(error.errorClass).toBe("ERROR.TRANSPORT");
      expect(error.errorCode).toBe("TRANSPORT_1001");
      expect(error.retry?.retryable).toBe(true);
    });

    test("createValidationError", () => {
      const error = createValidationError(
        "Schema validation failed",
        "corr-2",
        "VALIDATION_2001"
      );
      expect(error.errorClass).toBe("ERROR.VALIDATION");
      expect(error.errorCode).toBe("VALIDATION_2001");
      expect(error.retry?.retryable).toBe(false);
    });

    test("createAuthError", () => {
      const error = createAuthError("Authentication failed", "corr-3");
      expect(error.errorClass).toBe("ERROR.AUTH");
      expect(error.severity).toBe("HIGH");
      expect(error.retry?.retryable).toBe(false);
    });

    test("createSafetyError", () => {
      const error = createSafetyError("Safety violation", "corr-4");
      expect(error.errorClass).toBe("ERROR.SAFETY");
      expect(error.severity).toBe("CRITICAL");
      expect(error.retry?.retryable).toBe(false);
    });

    test("createRoutingError", () => {
      const error = createRoutingError("Illegal route", "corr-5");
      expect(error.errorClass).toBe("ERROR.ROUTING");
      expect(error.retry?.retryable).toBe(true);
    });

    test("createAlignmentError", () => {
      const error = createAlignmentError("Alignment violation", "corr-6");
      expect(error.errorClass).toBe("ERROR.ALIGNMENT");
      expect(error.severity).toBe("HIGH");
    });

    test("createConstitutionalError", () => {
      const error = createConstitutionalError(
        "Constitutional violation",
        "corr-7"
      );
      expect(error.errorClass).toBe("ERROR.CONSTITUTIONAL");
      expect(error.severity).toBe("CRITICAL");
    });

    test("createInternalError with cause", () => {
      const error = createInternalError(
        "Internal error",
        "corr-8",
        "INTERNAL_8001",
        undefined,
        {
          errorCode: "VALIDATION_2001",
          message: "Caused by validation error",
        }
      );
      expect(error.errorClass).toBe("ERROR.INTERNAL");
      expect(error.cause).toBeDefined();
      expect(error.cause?.errorCode).toBe("VALIDATION_2001");
    });
  });
});

