import { describeIdentity } from "../src/identity/identities";
import { enforceCapabilities } from "../src/identity/capabilities";
import { MCPEnvelope } from "../src/core/types";

describe("Identity helpers", () => {
  test("describeIdentity works", () => {
    const id = describeIdentity({
      node: { nodeId: "node-1" },
      module: { moduleId: "LDS" },
      agent: { agentId: "AGENT.IO" },
    });
    expect(id).toBe("node-1::LDS::AGENT.IO");
  });
});

function makeEnv(required: string[], declared: string[]): MCPEnvelope {
  return {
    header: {
      envelopeId: "env",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      layer: "MCP-AGENT",
      type: "REQUEST",
      source: { nodeId: "n1" },
      target: { nodeId: "n1" },
      capabilities: {
        declared: declared.map((id) => ({ id })),
        required: required.map((id) => ({ id })),
      },
    },
    body: { payloadType: "X", payload: {} },
    provenance: { route: [], hash: "h", signature: "s" },
    safety: { snapshotScope: "LIVE" },
  };
}

describe("Capability enforcement", () => {
  test("passes", () => {
    const env = makeEnv(["A", "B"], ["A", "B", "C"]);
    expect(() => enforceCapabilities(env)).not.toThrow();
  });

  test("fails", () => {
    const env = makeEnv(["A", "B"], ["A"]);
    expect(() => enforceCapabilities(env)).toThrow(/missing "B"/);
  });

  test("no required = pass", () => {
    const env: MCPEnvelope = {
      header: {
        envelopeId: "env",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        layer: "MCP-AGENT",
        type: "REQUEST",
        source: { nodeId: "n1" },
        target: { nodeId: "n1" },
        capabilities: { declared: [{ id: "ANY" }] },
      },
      body: { payloadType: "X", payload: {} },
      provenance: { route: [], hash: "h", signature: "s" },
      safety: { snapshotScope: "LIVE" },
    };
    expect(() => enforceCapabilities(env)).not.toThrow();
  });
});

