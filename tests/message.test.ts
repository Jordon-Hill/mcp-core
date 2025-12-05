/**
 * Tests for MCP v1.1 Message Model
 */

import {
  MCPMessage,
  MessageContext,
  MessagePayload,
  Intent,
  Identity
} from "../src/mcp/core/message";

describe("Message Model", () => {
  const createTestContext = (): MessageContext => ({
    caller: {
      nodeId: "test-node",
      moduleId: "test-module"
    },
    sessionId: "test-session",
    permissions: [
      {
        resource: "test-resource",
        action: "read"
      }
    ],
    provenance: [
      {
        nodeId: "test-node",
        moduleId: "test-module",
        timestamp: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });

  const createTestPayload = (): MessagePayload => ({
    schema: "test-schema",
    schemaVersion: "1.0",
    content: { test: "data" }
  });

  describe("MCPMessage structure", () => {
    it("should create a valid message with context, intent, and payload", () => {
      const message: MCPMessage = {
        context: createTestContext(),
        intent: "ANALYSIS",
        payload: createTestPayload()
      };

      expect(message.context).toBeDefined();
      expect(message.intent).toBe("ANALYSIS");
      expect(message.payload).toBeDefined();
      expect(message.payload.schema).toBe("test-schema");
    });

    it("should require schema declaration in payload", () => {
      const payload: MessagePayload = {
        schema: "test-schema",
        schemaVersion: "1.0",
        content: {}
      };

      expect(payload.schema).toBeDefined();
      expect(payload.schemaVersion).toBeDefined();
    });

    it("should support all defined intent types", () => {
      const intents: Intent[] = [
        "ANALYSIS",
        "PATTERN_EXTRACTION",
        "KG_MUTATION_PROPOSAL",
        "ALIGNMENT_REVIEW",
        "AGENT_EXECUTION",
        "FEDERATION_HANDSHAKE",
        "PROJECTION_GENERATION",
        "DATA_INGEST",
        "QUERY",
        "UPDATE"
      ];

      intents.forEach((intent) => {
        const message: MCPMessage = {
          context: createTestContext(),
          intent,
          payload: createTestPayload()
        };
        expect(message.intent).toBe(intent);
      });
    });
  });

  describe("MessageContext", () => {
    it("should require caller identity", () => {
      const context: MessageContext = createTestContext();
      expect(context.caller.nodeId).toBeDefined();
    });

    it("should track provenance chain", () => {
      const context: MessageContext = createTestContext();
      expect(context.provenance.length).toBeGreaterThan(0);
    });

    it("should include session tracking", () => {
      const context: MessageContext = createTestContext();
      expect(context.sessionId).toBeDefined();
    });
  });

  describe("Identity", () => {
    it("should support node-only identity", () => {
      const identity: Identity = {
        nodeId: "node-1"
      };
      expect(identity.nodeId).toBe("node-1");
      expect(identity.moduleId).toBeUndefined();
      expect(identity.agentId).toBeUndefined();
    });

    it("should support module identity", () => {
      const identity: Identity = {
        nodeId: "node-1",
        moduleId: "module-1"
      };
      expect(identity.moduleId).toBe("module-1");
    });

    it("should support agent identity", () => {
      const identity: Identity = {
        nodeId: "node-1",
        moduleId: "module-1",
        agentId: "agent-1"
      };
      expect(identity.agentId).toBe("agent-1");
    });
  });
});
