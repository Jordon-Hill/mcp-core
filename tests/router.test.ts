/**
 * Tests for MCP v1.1 Router
 */

import { routeMessage, RouterContext, RoutingResult } from "../src/mcp/core/router";
import {
  MCPMessage,
  MessageContext,
  MessagePayload
} from "../src/mcp/core/message";
import { Subsystem } from "../src/mcp/core/routing";
import { AlignmentReviewResult } from "../src/mcp/core/alignment";

describe("Router", () => {
  const createTestContext = (): MessageContext => ({
    caller: {
      nodeId: "local",
      moduleId: "MCP"
    },
    sessionId: "test-session",
    permissions: [],
    provenance: [
      {
        nodeId: "local",
        moduleId: "MCP",
        timestamp: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });

  const createTestMessage = (intent: string): MCPMessage => ({
    context: createTestContext(),
    intent: intent as any,
    payload: {
      schema: "test-schema",
      schemaVersion: "1.0",
      content: {
        reversible: true
      }
    }
  });

  const createRouterContext = (
    routeHandler?: (message: MCPMessage, to: Subsystem) => Promise<void>,
    alignmentHandler?: (
      message: MCPMessage,
      from: Subsystem,
      to: Subsystem
    ) => Promise<AlignmentReviewResult>
  ): RouterContext => ({
    currentNodeId: "local",
    routeHandler:
      routeHandler ||
      (async () => {
        // Default no-op handler
      }),
    alignmentHandler
  });

  describe("routeMessage", () => {
    it("should reject illegal routes", async () => {
      const message = createTestMessage("AGENT_EXECUTION");
      const ctx = createRouterContext();

      const result = await routeMessage(message, "AGENTS", "KG", ctx);

      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.error).toContain("Illegal route");
    });

    it("should reject messages violating constitutional constraints", async () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "QUERY",
        payload: {
          schema: "",
          schemaVersion: "1.0",
          content: {}
        }
      };
      const ctx = createRouterContext();

      const result = await routeMessage(message, "MCP", "CRYSTALLINE", ctx);

      expect(result.success).toBe(false);
      expect(result.halted).toBe(true);
      expect(result.constraintResult?.valid).toBe(false);
    });

    it("should route valid messages successfully", async () => {
      const message = createTestMessage("QUERY");
      let routed = false;
      const ctx = createRouterContext(async (msg, to) => {
        routed = true;
        expect(to).toBe("CRYSTALLINE");
      });

      const result = await routeMessage(message, "MCP", "CRYSTALLINE", ctx);

      expect(result.success).toBe(true);
      expect(result.routed).toBe(true);
      expect(routed).toBe(true);
    });

    it("should forward to Alignment when required", async () => {
      const message = createTestMessage("AGENT_EXECUTION");
      let alignmentCalled = false;
      const ctx = createRouterContext(undefined, async (msg, from, to) => {
        alignmentCalled = true;
        return {
          approved: true,
          actor: "JUDGE",
          explanation: "Approved"
        };
      });

      const result = await routeMessage(message, "MCP", "AGENTS", ctx);

      expect(alignmentCalled).toBe(true);
      expect(result.alignmentResult).toBeDefined();
    });

    it("should halt when Mediator halts", async () => {
      const message = createTestMessage("AGENT_EXECUTION");
      const ctx = createRouterContext(undefined, async () => {
        return {
          approved: false,
          actor: "MEDIATOR",
          halt: true,
          explanation: "Halted by Mediator"
        };
      });

      const result = await routeMessage(message, "MCP", "AGENTS", ctx);

      expect(result.success).toBe(false);
      expect(result.halted).toBe(true);
      expect(result.error).toContain("Mediator");
    });

    it("should apply Judge modifications", async () => {
      const message = createTestMessage("AGENT_EXECUTION");
      const modifiedContent = { modified: true };
      const ctx = createRouterContext(undefined, async () => {
        return {
          approved: false,
          actor: "JUDGE",
          modifications: {
            payload: {
              schema: "test-schema",
              schemaVersion: "1.0",
              content: modifiedContent
            }
          },
          explanation: "Modified by Judge"
        };
      });

      let routedMessage: MCPMessage | null = null;
      const routeCtx = createRouterContext(async (msg, to) => {
        routedMessage = msg;
      });
      routeCtx.alignmentHandler = ctx.alignmentHandler;

      const result = await routeMessage(message, "MCP", "AGENTS", routeCtx);

      expect(result.success).toBe(true);
      expect(routedMessage).toBeDefined();
      expect(
        (routedMessage!.payload.content as Record<string, unknown>).modified
      ).toBe(true);
    });

    it("should handle route handler errors", async () => {
      const message = createTestMessage("QUERY");
      const ctx = createRouterContext(async () => {
        throw new Error("Route handler error");
      });

      const result = await routeMessage(message, "MCP", "CRYSTALLINE", ctx);

      expect(result.success).toBe(false);
      expect(result.error).toContain("error");
    });
  });
});
