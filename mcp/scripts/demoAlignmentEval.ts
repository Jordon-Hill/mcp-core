import { MCPKeyring, NodeSigner } from "../src/identity/keyring";
import { buildEnvelope, EnvelopeBuildParams } from "../src/core/envelope";
import { defaultRoutingTable, registerRoute } from "../src/routing/tables";
import { IODispatcher } from "../src/routing/ioDispatcher";
import { AgentDispatcher } from "../src/routing/agentDispatcher";
import { FedDispatcher } from "../src/routing/fedDispatcher";
import { routeEnvelope } from "../src/routing/router";
import { DemoAlignmentGateway } from "../src/gateways/alignmentGateway";
import {
  ALIGN_EVAL_REQUEST,
  AlignmentEvalRequestPayload,
} from "../src/contracts/alignmentContracts";

async function main() {
  // 1. Set up keys and signer for node-1
  const keyring = new MCPKeyring();
  keyring.generateNodeKeys("node-1");

  const signer = new NodeSigner(keyring, "node-1");

  // 2. Build routing table with an Alignment route
  const routingTable = JSON.parse(
    JSON.stringify(defaultRoutingTable)
  ); // simple clone

  registerRoute(routingTable, "MCP-AGENT", ALIGN_EVAL_REQUEST, {
    targetModule: "ALIGNMENT",
    handler: "handleAlignmentEval",
  });

  // 3. Create dispatchers
  const ioDispatcher = new IODispatcher();
  const agentDispatcher = new AgentDispatcher();
  const fedDispatcher = new FedDispatcher();

  // 4. Create DemoAlignmentGateway and hook into Agent dispatcher
  const demoAlignmentGateway = new DemoAlignmentGateway({
    signer,
    emittingIdentity: {
      nodeId: "node-1",
      moduleId: "ALIGNMENT",
      agentId: "ALIGN.DEMO",
    },
  });

  agentDispatcher.registerHandler(
    "handleAlignmentEval",
    async (envelope) => {
      await demoAlignmentGateway.handle(envelope);
    }
  );

  // 5. Build an ALIGN.EVAL.REQUEST envelope
  const now = new Date().toISOString();

  const payload: AlignmentEvalRequestPayload = {
    subjectId: "demo-subject-1",
    snapshotScope: "LIVE",
    contextRefs: ["kg:node:demo-subject-1"],
  };

  const params: EnvelopeBuildParams = {
    header: {
      timestamp: now,
      version: "1.0.0",
      layer: "MCP-AGENT",
      type: "REQUEST",
      source: {
        nodeId: "node-1",
        moduleId: "AGENT.DEMO",
        agentId: "AGENT.ALIGN.CLIENT",
      },
      target: {
        nodeId: "node-1",
        moduleId: "ALIGNMENT",
      },
      capabilities: {
        declared: [],
      },
    },
    body: {
      payloadType: ALIGN_EVAL_REQUEST,
      payload,
    },
    provenance: {
      route: [
        {
          nodeId: "node-1",
          moduleId: "AGENT.DEMO",
          agentId: "AGENT.ALIGN.CLIENT",
          timestamp: now,
        },
      ],
    },
    safety: {
      snapshotScope: "LIVE",
    },
  };

  const requestEnvelope = buildEnvelope(params, signer);

  // eslint-disable-next-line no-console
  console.log("[ALIGN DEMO] Built request envelope id:", requestEnvelope.header.envelopeId);

  // 6. Route the request envelope through MCP
  await routeEnvelope(requestEnvelope, {
    routingTable,
    ioDispatcher,
    agentDispatcher,
    fedDispatcher,
  });

  // eslint-disable-next-line no-console
  console.log("[ALIGN DEMO] Routing complete.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("demoAlignmentEval failed:", err);
  process.exit(1);
});

