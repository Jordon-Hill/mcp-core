import { MCPKeyring, NodeSigner } from "../src/identity/keyring";
import { buildEnvelope, EnvelopeBuildParams } from "../src/core/envelope";
import {
  defaultRoutingTable,
  registerRoute,
} from "../src/routing/tables";
import { IODispatcher } from "../src/routing/ioDispatcher";
import { AgentDispatcher } from "../src/routing/agentDispatcher";
import { FedDispatcher } from "../src/routing/fedDispatcher";
import { routeEnvelope } from "../src/routing/router";
import {
  FED_SNAPSHOT_OFFER,
  FederatedSnapshotOfferPayload,
} from "../src/contracts/federationContracts";
import { DemoFederationGateway } from "../src/gateways/federationGateway";

async function main() {
  // Simulate two nodes: node-A (offering) and node-B (receiving)
  const keyring = new MCPKeyring();
  keyring.generateNodeKeys("node-A");
  keyring.generateNodeKeys("node-B");

  const signerA = new NodeSigner(keyring, "node-A");
  const signerB = new NodeSigner(keyring, "node-B");

  // Routing table for MCP-FED
  const routingTable = JSON.parse(
    JSON.stringify(defaultRoutingTable)
  );

  registerRoute(routingTable, "MCP-FED", FED_SNAPSHOT_OFFER, {
    targetModule: "FEDERATION",
    handler: "handleFederationOffer",
  });

  // Dispatchers
  const ioDispatcher = new IODispatcher();
  const agentDispatcher = new AgentDispatcher();
  const fedDispatcher = new FedDispatcher();

  // Demo federation gateway on node-B
  const demoGateway = new DemoFederationGateway({
    signer: signerB,
    emittingIdentity: {
      nodeId: "node-B",
      moduleId: "FEDERATION",
      agentId: "FED.DEMO",
    },
  });

  fedDispatcher.registerHandler(
    "handleFederationOffer",
    async (env) => {
      await demoGateway.handle(env);
    }
  );

  // Build a FED.SNAPSHOT.OFFER envelope from node-A → node-B
  const now = new Date().toISOString();

  const payload: FederatedSnapshotOfferPayload = {
    snapshotId: "fed-demo-snap-001",
    fromNodeId: "node-A",
    description: "Demo snapshot offer from node-A to node-B",
  };

  const params: EnvelopeBuildParams = {
    header: {
      timestamp: now,
      version: "1.0.0",
      layer: "MCP-FED",
      type: "EVENT",
      source: {
        nodeId: "node-A",
        moduleId: "FEDERATION",
        agentId: "FED.DEMO.CLIENT",
      },
      target: {
        nodeId: "node-B",
        moduleId: "FEDERATION",
      },
      capabilities: { declared: [] },
    },
    body: {
      payloadType: FED_SNAPSHOT_OFFER,
      payload,
    },
    provenance: {
      route: [
        {
          nodeId: "node-A",
          moduleId: "FEDERATION",
          agentId: "FED.DEMO.CLIENT",
          timestamp: now,
        },
      ],
    },
    safety: {
      snapshotScope: payload.snapshotId,
    },
  };

  const offerEnvelope = buildEnvelope(params, signerA);

  // eslint-disable-next-line no-console
  console.log(
    "[FED DEMO] Built snapshot offer envelope id:",
    offerEnvelope.header.envelopeId
  );

  // Route the offer via MCP-FED
  await routeEnvelope(offerEnvelope, {
    routingTable,
    ioDispatcher,
    agentDispatcher,
    fedDispatcher,
  });

  // eslint-disable-next-line no-console
  console.log("[FED DEMO] Routing complete.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("demoFederationHandshake failed:", err);
  process.exit(1);
});

