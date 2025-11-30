import { MCPKeyring, NodeSigner } from "../src/identity/keyring";
import { buildEnvelope, EnvelopeBuildParams } from "../src/core/envelope";
import { defaultRoutingTable, registerRoute } from "../src/routing/tables";
import { IODispatcher } from "../src/routing/ioDispatcher";
import { AgentDispatcher } from "../src/routing/agentDispatcher";
import { FedDispatcher } from "../src/routing/fedDispatcher";
import { routeEnvelope } from "../src/routing/router";
import {
  AGENT_EXECUTE_PROCEDURE,
  AgentExecuteProcedurePayload,
} from "../src/contracts/agentContracts";
import { DemoAgentsGateway } from "../src/gateways/agentGateway";

async function main() {
  // 1. Keys + signer for node-1
  const keyring = new MCPKeyring();
  keyring.generateNodeKeys("node-1");

  const signer = new NodeSigner(keyring, "node-1");

  // 2. Routing table with Agents route
  const routingTable = JSON.parse(
    JSON.stringify(defaultRoutingTable)
  );

  registerRoute(routingTable, "MCP-AGENT", AGENT_EXECUTE_PROCEDURE, {
    targetModule: "AGENTS",
    handler: "handleAgentExecute",
  });

  // 3. Dispatchers
  const ioDispatcher = new IODispatcher();
  const agentDispatcher = new AgentDispatcher();
  const fedDispatcher = new FedDispatcher();

  // 4. Demo Agents gateway
  const demoAgentsGateway = new DemoAgentsGateway({
    signer,
    emittingIdentity: {
      nodeId: "node-1",
      moduleId: "AGENTS",
      agentId: "AGENT.DEMO.EXECUTOR",
    },
  });

  agentDispatcher.registerHandler(
    "handleAgentExecute",
    async (envelope) => {
      await demoAgentsGateway.handle(envelope);
    }
  );

  // 5. Build AGENT.EXECUTE.PROCEDURE envelope
  const now = new Date().toISOString();

  const payload: AgentExecuteProcedurePayload = {
    procedureId: "demo-procedure-1",
    runId: `run-${Date.now()}`,
    snapshotScope: "LIVE",
    parameters: {
      exampleParam: 42,
      note: "Demo run",
    },
  };

  const params: EnvelopeBuildParams = {
    header: {
      timestamp: now,
      version: "1.0.0",
      layer: "MCP-AGENT",
      type: "COMMAND",
      source: {
        nodeId: "node-1",
        moduleId: "AGENT.CLIENT",
        agentId: "AGENT.CLIENT.DEMO",
      },
      target: {
        nodeId: "node-1",
        moduleId: "AGENTS",
      },
      capabilities: {
        declared: [],
      },
    },
    body: {
      payloadType: AGENT_EXECUTE_PROCEDURE,
      payload,
    },
    provenance: {
      route: [
        {
          nodeId: "node-1",
          moduleId: "AGENT.CLIENT",
          agentId: "AGENT.CLIENT.DEMO",
          timestamp: now,
        },
      ],
    },
    safety: {
      snapshotScope: "LIVE",
    },
  };

  const commandEnvelope = buildEnvelope(params, signer);

  // eslint-disable-next-line no-console
  console.log(
    "[AGENT DEMO] Built execute command envelope id:",
    commandEnvelope.header.envelopeId
  );

  // 6. Route the command envelope
  await routeEnvelope(commandEnvelope, {
    routingTable,
    ioDispatcher,
    agentDispatcher,
    fedDispatcher,
  });

  // eslint-disable-next-line no-console
  console.log("[AGENT DEMO] Routing complete.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("demoAgentExecute failed:", err);
  process.exit(1);
});

