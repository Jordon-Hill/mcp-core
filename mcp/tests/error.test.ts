import { MCPEnvelope, MCPIdentityRef } from "../src/core/types";
import { MCPKeyring, NodeSigner, NodeVerifier } from "../src/identity/keyring";
import { buildErrorEnvelope } from "../src/core/error";
import { validateEnvelope } from "../src/core/validation";

function makeOriginal(): MCPEnvelope {
  return {
    header: {
      envelopeId: "orig",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
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

describe("Error envelope builder", () => {
  test("constructs valid error envelope", () => {
    const keyring = new MCPKeyring();
    keyring.generateNodeKeys("n2");

    const signer = new NodeSigner(keyring, "n2");
    const verifier = new NodeVerifier(keyring);

    const original = makeOriginal();
    const emitting: MCPIdentityRef = { nodeId: "n2" };

    const err = buildErrorEnvelope(
      original,
      emitting,
      signer,
      "ERROR.INTERNAL",
      "fail",
      { info: 1 }
    );

    expect(() => validateEnvelope(err, verifier)).not.toThrow();
    expect(err.header.type).toBe("RESPONSE");
    expect(err.body.payloadType).toBe("MCP.ERROR");
    expect((err.body as any).correlationId).toBeUndefined();
  });
});

