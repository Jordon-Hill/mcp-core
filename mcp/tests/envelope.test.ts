import { buildEnvelope, EnvelopeBuildParams } from "../src/core/envelope";
import { MCPKeyring, NodeSigner, NodeVerifier } from "../src/identity/keyring";
import { validateEnvelope } from "../src/core/validation";

function makeKeyringAndSigner(nodeId = "node-1") {
  const keyring = new MCPKeyring();
  keyring.generateNodeKeys(nodeId);
  const signer = new NodeSigner(keyring, nodeId);
  const verifier = new NodeVerifier(keyring);
  return { keyring, signer, verifier };
}

function makeBaseParams(nodeId = "node-1"): EnvelopeBuildParams {
  return {
    header: {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      layer: "MCP-AGENT",
      type: "REQUEST",
      priority: "NORMAL",
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
    },
    safety: { snapshotScope: "LIVE" },
  };
}

describe("MCP Envelope Builder", () => {
  test("deterministic hash + default envelopeId", () => {
    const { signer, verifier } = makeKeyringAndSigner("node-1");
    const params = makeBaseParams("node-1");
    const env1 = buildEnvelope(params, signer);
    const env2 = buildEnvelope(params, signer);

    expect(env1.provenance.hash).toBe(env2.provenance.hash);
    expect(env1.header.envelopeId).toBe(env1.provenance.hash);
    expect(() => validateEnvelope(env1, verifier)).not.toThrow();
  });

  test("payload change changes hash", () => {
    const { signer } = makeKeyringAndSigner("node-1");
    const p1 = makeBaseParams("node-1");
    const p2 = makeBaseParams("node-1");

    p2.body.payload = { ping: true, x: 1 };

    const e1 = buildEnvelope(p1, signer);
    const e2 = buildEnvelope(p2, signer);

    expect(e1.provenance.hash).not.toBe(e2.provenance.hash);
  });

  test("explicit envelopeId respected", () => {
    const { signer } = makeKeyringAndSigner("node-1");
    const p = makeBaseParams("node-1");
    p.header.envelopeId = "custom-id";

    const e = buildEnvelope(p, signer);
    expect(e.header.envelopeId).toBe("custom-id");
  });
});

