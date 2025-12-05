/**
 * Tests for MCP v1.1 Federation
 */

import {
  verifyNodeIdentity,
  negotiateCapabilities,
  performFederationHandshake,
  NodeCapabilities,
  FederationHandshakeRequest,
  SyncCapability
} from "../src/mcp/core/federation";
import { Identity } from "../src/mcp/core/message";

describe("Federation", () => {
  const createTestCapabilities = (): NodeCapabilities => ({
    nodeId: "test-node",
    supportedIntents: [
      "QUERY",
      "DATA_INGEST",
      "FEDERATION_HANDSHAKE"
    ],
    alignmentCompatible: true,
    autonomyLevel: "FULL",
    syncCapabilities: [
      {
        resource: "test-resource",
        syncType: "VOLUNTARY"
      }
    ]
  });

  describe("verifyNodeIdentity", () => {
    it("should verify valid node identity", () => {
      const identity: Identity = {
        nodeId: "node-1"
      };

      const result = verifyNodeIdentity(identity);
      expect(result.verified).toBe(true);
    });

    it("should reject identity without nodeId", () => {
      const identity: Identity = {
        nodeId: ""
      };

      const result = verifyNodeIdentity(identity);
      expect(result.verified).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject reserved 'local' nodeId", () => {
      const identity: Identity = {
        nodeId: "local"
      };

      const result = verifyNodeIdentity(identity);
      expect(result.verified).toBe(false);
      expect(result.error).toContain("reserved");
    });
  });

  describe("negotiateCapabilities", () => {
    it("should negotiate compatible capabilities", () => {
      const requesting = createTestCapabilities();
      const target: NodeCapabilities = {
        nodeId: "target-node",
        supportedIntents: ["QUERY", "DATA_INGEST", "FEDERATION_HANDSHAKE"],
        alignmentCompatible: true,
        autonomyLevel: "FULL",
        syncCapabilities: [
          {
            resource: "test-resource",
            syncType: "VOLUNTARY"
          }
        ]
      };

      const result = negotiateCapabilities(requesting, target);
      expect(result.compatible).toBe(true);
      expect(result.negotiated).toBeDefined();
    });

    it("should reject incompatible alignment", () => {
      const requesting = createTestCapabilities();
      const target: NodeCapabilities = {
        ...createTestCapabilities(),
        alignmentCompatible: false
      };

      const result = negotiateCapabilities(requesting, target);
      expect(result.compatible).toBe(false);
      expect(result.error).toContain("Alignment");
    });

    it("should reject nodes without autonomy", () => {
      const requesting: NodeCapabilities = {
        ...createTestCapabilities(),
        autonomyLevel: "NONE"
      };
      const target = createTestCapabilities();

      const result = negotiateCapabilities(requesting, target);
      expect(result.compatible).toBe(false);
      expect(result.error).toContain("autonomy");
    });

    it("should find common intents", () => {
      const requesting = createTestCapabilities();
      const target: NodeCapabilities = {
        ...createTestCapabilities(),
        supportedIntents: ["QUERY", "DATA_INGEST"]
      };

      const result = negotiateCapabilities(requesting, target);
      expect(result.compatible).toBe(true);
      expect(result.negotiated?.supportedIntents).toEqual([
        "QUERY",
        "DATA_INGEST"
      ]);
    });

    it("should reject if no common intents", () => {
      const requesting = createTestCapabilities();
      const target: NodeCapabilities = {
        ...createTestCapabilities(),
        supportedIntents: ["ANALYSIS"]
      };

      const result = negotiateCapabilities(requesting, target);
      expect(result.compatible).toBe(false);
      expect(result.error).toContain("common");
    });
  });

  describe("performFederationHandshake", () => {
    it("should perform successful handshake", async () => {
      const request: FederationHandshakeRequest = {
        requestingNode: {
          nodeId: "node-1"
        },
        requestingCapabilities: createTestCapabilities(),
        targetNode: {
          nodeId: "node-2"
        }
      };

      const result = await performFederationHandshake(request);

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      expect(result.compatible).toBe(true);
      expect(result.negotiatedCapabilities).toBeDefined();
      expect(result.syncAgreement).toBeDefined();
      expect(result.syncAgreement?.voluntary).toBe(true);
    });

    it("should reject invalid requesting node identity", async () => {
      const request: FederationHandshakeRequest = {
        requestingNode: {
          nodeId: ""
        },
        requestingCapabilities: createTestCapabilities(),
        targetNode: {
          nodeId: "node-2"
        }
      };

      const result = await performFederationHandshake(request);

      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
    });

    it("should reject incompatible capabilities", async () => {
      const request: FederationHandshakeRequest = {
        requestingNode: {
          nodeId: "node-1"
        },
        requestingCapabilities: {
          ...createTestCapabilities(),
          alignmentCompatible: false
        },
        targetNode: {
          nodeId: "node-2"
        }
      };

      const result = await performFederationHandshake(request);

      expect(result.success).toBe(false);
      expect(result.compatible).toBe(false);
    });
  });
});
