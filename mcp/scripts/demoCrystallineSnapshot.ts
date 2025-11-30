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
  CRYS_SNAPSHOT_REQUEST,
  CrystallineSnapshotRequestPayload,
} from "../src/contracts/crystallineContracts";
import { DemoCrystallineGateway } from "../src/gateways/crystallineGateway";

async function main() {
  // 1. Keys + signer for node-1
  const keyring = new MCPKeyring();
  keyring.generateNodeKeys("node-1");

  const signer = new NodeSigner(keyring, "node-1");

  // 2. Routing table: Crystalline lives under MCP-AGENT
  const routingTable = JSON.parse(
    JSON.stringify(defaultRoutingTable)
  );

  registerRoute(
    routingTable,
    "MCP-AGENT",
    CRYS_SNAPSHOT_REQUEST,
    {
      targetModule: "CRYSTALLINE",
      handler: "handleCrystallineSnapshot",
    }
  );

  // 3. Dispatchers
  const ioDispatcher = new IODispatcher();
  const agentDispatcher = new AgentDispatcher();
  const fedDispatcher = new FedDispatcher();

  // 4. Demo Crystalline gateway
  const demoGateway = new DemoCrystallineGateway(
    signer,
    {
      nodeId: "node-1",
      moduleId: "CRYSTALLINE",
      agentId: "CRYS.DEMO",
    }
  );

  agentDispatcher.registerHandler(
    "handleCrystallineSnapshot",
    async (env) => {
      await demoGateway.handle(env);
    }
  );

  // 5. Build CRYS_SNAPSHOT_REQUEST envelope
  const now = new Date().toISOString();

  const payload: CrystallineSnapshotRequestPayload = {
    snapshotId: "demo-snap-001",
    includeMeta: true,
  };

  const params: EnvelopeBuildParams = {
    header: {
      timestamp: now,
      version: "1.0.0",
      layer: "MCP-AGENT",
      type: "REQUEST",
      source: {
        nodeId: "node-1",
        moduleId: "AGENT.CLIENT",
        agentId: "AGENT.CRYS.CLIENT",
      },
      target: {
        nodeId: "node-1",
        moduleId: "CRYSTALLINE",
      },
      capabilities: { declared: [] },
    },
    body: {
      payloadType: CRYS_SNAPSHOT_REQUEST,
      payload,
    },
    provenance: {
      route: [
        {
          nodeId: "node-1",
          moduleId: "AGENT.CLIENT",
          agentId: "AGENT.CRYS.CLIENT",
          timestamp: now,
        },
      ],
    },
    safety: {
      snapshotScope: payload.snapshotId,
    },
  };

  const requestEnvelope = buildEnvelope(params, signer);

  // eslint-disable-next-line no-console
  console.log(
    "[CRYS DEMO] Built request envelope id:",
    requestEnvelope.header.envelopeId
  );

  // 6. Route it
  await routeEnvelope(requestEnvelope, {
    routingTable,
    ioDispatcher,
    agentDispatcher,
    fedDispatcher,
  });

  // eslint-disable-next-line no-console
  console.log("[CRYS DEMO] Routing complete.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("demoCrystallineSnapshot failed:", err);
  process.exit(1);
});

