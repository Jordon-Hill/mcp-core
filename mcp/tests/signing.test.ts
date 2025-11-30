import { MCPKeyring, NodeSigner, NodeVerifier } from "../src/identity/keyring";
import { computeEnvelopeHash } from "../src/core/hashing";
import { MCPEnvelope } from "../src/core/types";

function dummyEnvelope(nodeId = "node-1"): MCPEnvelope {
  return {
    header: {
      envelopeId: "",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      layer: "MCP-AGENT",
      type: "REQUEST",
      source: { nodeId },
      target: { nodeId },
      capabilities: { declared: [] },
    },
    body: {
      payloadType: "TEST.PING",
      payload: { ping: true },
    },
    provenance: {
      route: [{ nodeId, timestamp: new Date().toISOString() }],
      hash: "",
      signature: "",
    },
    safety: { snapshotScope: "LIVE" },
  };
}

describe("Signing/Verification", () => {
  test("round-trip works", () => {
    const keyring = new MCPKeyring();
    keyring.generateNodeKeys("node-1");

    const signer = new NodeSigner(keyring, "node-1");
    const verifier = new NodeVerifier(keyring);

    const env = dummyEnvelope("node-1");
    const hash = computeEnvelopeHash(env);
    env.provenance.hash = hash;
    env.provenance.signature = signer.sign(hash, env);

    expect(verifier.verify(hash, env.provenance.signature, env)).toBe(true);
  });

  test("fails with wrong node", () => {
    const keyring = new MCPKeyring();
    keyring.generateNodeKeys("node-1");
    keyring.generateNodeKeys("node-2");

    const signer1 = new NodeSigner(keyring, "node-1");
    const verifier = new NodeVerifier(keyring);

    const env = dummyEnvelope("node-1");
    const hash = computeEnvelopeHash(env);
    env.provenance.hash = hash;
    env.provenance.signature = signer1.sign(hash, env);

    env.header.source.nodeId = "node-2";

    expect(verifier.verify(hash, env.provenance.signature, env)).toBe(false);
  });
});

