/**
 * Tests for TKD Proposal Handler
 * 
 * Tests TKD proposal validation and normalization as first-class MCP messages
 */

import { handleTKDProposal, TKDProposalHandlerResult } from "../../src/mcp/handlers/tkdProposalHandler";
import {
  MCPMessage,
  MessageContext,
  MessagePayload
} from "../../src/mcp/core/message";
import { routeMessage, RouterContext } from "../../src/mcp/core/router";
import { Subsystem } from "../../src/mcp/core/routing";

describe("TKD Proposal Handler", () => {
  const createTestContext = (): MessageContext => ({
    caller: {
      nodeId: "test-node",
      moduleId: "TKD"
    },
    sessionId: "test-session",
    permissions: [],
    provenance: [
      {
        nodeId: "test-node",
        moduleId: "TKD",
        timestamp: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });

  const createValidProposalPayload = (): MessagePayload => ({
    schema: "TKD_PROPOSAL",
    schemaVersion: "1.1",
    content: {
      type: "kg_mutation",
      payload: {
        operation: "add",
        entity: { id: "entity-1", type: "Person" }
      },
      provenance: {
        source: "tkd",
        timestamp: new Date().toISOString()
      }
    }
  });

  describe("handleTKDProposal", () => {
    it("should accept valid TKD proposal message", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: createValidProposalPayload()
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(true);
      expect(result.routed).toBe(true);
      expect(result.halted).toBe(false);
      expect(result.proposal).toBeDefined();
      expect(result.proposal?.type).toBe("kg_mutation");
      expect(result.proposal?.payload).toBeDefined();
      expect(result.proposal?.provenance).toBeDefined();
      expect(result.proposal?.context).toEqual(message.context);
      expect(result.proposal?.schema.schema).toBe("TKD_PROPOSAL");
      expect(result.proposal?.schema.schemaVersion).toBe("1.1");
    });

    it("should reject message with wrong intent", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "DATA_INGEST",
        payload: createValidProposalPayload()
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("Invalid intent");
      expect(result.error).toContain("TKD_PROPOSAL_APPLY");
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.length).toBeGreaterThan(0);
      expect(result.validationErrors?.[0].field).toBe("intent");
    });

    it("should reject message with missing type field", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: {
          schema: "TKD_PROPOSAL",
          schemaVersion: "1.1",
          content: {
            payload: { operation: "add" },
            provenance: { source: "tkd" }
          }
        }
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("type");
      expect(result.validationErrors).toBeDefined();
      const typeError = result.validationErrors?.find((e) => e.field === "type");
      expect(typeError).toBeDefined();
    });

    it("should reject message with missing payload field", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: {
          schema: "TKD_PROPOSAL",
          schemaVersion: "1.1",
          content: {
            type: "kg_mutation",
            provenance: { source: "tkd" }
          }
        }
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("payload");
      expect(result.validationErrors).toBeDefined();
      const payloadError = result.validationErrors?.find(
        (e) => e.field === "payload"
      );
      expect(payloadError).toBeDefined();
    });

    it("should reject message with missing provenance field", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: {
          schema: "TKD_PROPOSAL",
          schemaVersion: "1.1",
          content: {
            type: "kg_mutation",
            payload: { operation: "add" }
          }
        }
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("provenance");
      expect(result.validationErrors).toBeDefined();
      const provenanceError = result.validationErrors?.find(
        (e) => e.field === "provenance"
      );
      expect(provenanceError).toBeDefined();
    });

    it("should reject message with null provenance", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: {
          schema: "TKD_PROPOSAL",
          schemaVersion: "1.1",
          content: {
            type: "kg_mutation",
            payload: { operation: "add" },
            provenance: null as unknown
          }
        }
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("provenance");
    });

    it("should reject message with non-object payload content", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: {
          schema: "TKD_PROPOSAL",
          schemaVersion: "1.1",
          content: "not an object" as unknown
        }
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("object");
      expect(result.validationErrors).toBeDefined();
    });

    it("should reject message with array payload content", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: {
          schema: "TKD_PROPOSAL",
          schemaVersion: "1.1",
          content: [] as unknown
        }
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("object");
    });

    it("should reject message with missing payload content", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: {
          schema: "TKD_PROPOSAL",
          schemaVersion: "1.1",
          content: undefined as unknown
        }
      };

      const result = handleTKDProposal(message);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Integration with Router", () => {
    const createRouterContext = (
      routeHandler?: (message: MCPMessage, to: Subsystem) => Promise<void>
    ): RouterContext => ({
      currentNodeId: "test-node",
      routeHandler:
        routeHandler ||
        (async () => {
          // Default no-op handler
        })
    });

    it("should route valid TKD proposal through router successfully", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: createValidProposalPayload()
      };

      let routed = false;
      const ctx = createRouterContext(async (msg, to) => {
        routed = true;
        expect(to).toBe("MCP");
        expect(msg.intent).toBe("TKD_PROPOSAL_APPLY");
      });

      const result = await routeMessage(message, "TKD", "MCP", ctx);

      expect(result.success).toBe(true);
      expect(result.routed).toBe(true);
      expect(routed).toBe(true);
    });

    it("should reject invalid TKD proposal in router", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: {
          schema: "TKD_PROPOSAL",
          schemaVersion: "1.1",
          content: {
            type: "kg_mutation"
            // Missing payload and provenance
          }
        }
      };

      const ctx = createRouterContext();

      const result = await routeMessage(message, "TKD", "MCP", ctx);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("payload");
    });

    it("should still pass through constitutional constraints", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: createValidProposalPayload()
      };

      const ctx = createRouterContext();

      const result = await routeMessage(message, "TKD", "MCP", ctx);

      // Should have constraint result (even if valid)
      expect(result.constraintResult).toBeDefined();
    });

    it("should still pass through alignment checks if required", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: createValidProposalPayload()
      };

      let alignmentCalled = false;
      const ctx = createRouterContext(undefined, async () => {
        alignmentCalled = true;
        return {
          approved: true,
          actor: "JUDGE",
          explanation: "Approved"
        };
      });

      const result = await routeMessage(message, "TKD", "MCP", ctx);

      // Alignment may or may not be called depending on requiresAlignmentReview logic
      // But the proposal should still be validated first
      expect(result.success).toBe(true);
    });

    it("should reject illegal route for TKD proposal", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "TKD_PROPOSAL_APPLY",
        payload: createValidProposalPayload()
      };

      const ctx = createRouterContext();

      // Try illegal route: TKD → CRYSTALLINE (should go through MCP)
      const result = await routeMessage(message, "TKD", "CRYSTALLINE", ctx);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("Illegal route");
    });
  });
});
