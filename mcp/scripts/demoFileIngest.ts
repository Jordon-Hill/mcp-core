import { MCPKeyring, NodeSigner, NodeVerifier } from "../src/identity/keyring";
import { buildEnvelope } from "../src/core/envelope";
import { routeEnvelope } from "../src/routing/router";
import { defaultRoutingTable, registerRoute } from "../src/routing/tables";
import { IODispatcher } from "../src/routing/ioDispatcher";
import { AgentDispatcher } from "../src/routing/agentDispatcher";
import { FedDispatcher } from "../src/routing/fedDispatcher";
import { QueueLdsGateway } from "../src/gateways/ldsGateway";
import { InMemoryLdsIngestQueue } from "../src/gateways/ldsIngestQueue";
import { FileIngestAdapter } from "../src/adapters/io/fileIngestAdapter";

async function main() {
  const keyring = new MCPKeyring();
  keyring.generateNodeKeys("node-1");

  const signer = new NodeSigner(keyring, "node-1");
  const verifier = new NodeVerifier(keyring);

  // Routing table
  const routingTable = JSON.parse(
    JSON.stringify(defaultRoutingTable)
  ); // simple clone for v0

  registerRoute(routingTable, "MCP-IO", "LDS.INGEST.FILE", {
    targetModule: "LDS",
    handler: "handleFileIngest",
  });

  // Dispatchers + LDS queue
  const ioDispatcher = new IODispatcher();
  const agentDispatcher = new AgentDispatcher();
  const fedDispatcher = new FedDispatcher();
  const ingestQueue = new InMemoryLdsIngestQueue();
  const ldsGateway = new QueueLdsGateway(ingestQueue);

  ioDispatcher.registerHandler("handleFileIngest", async (env) => {
    console.log("LDS.INGEST.FILE payload:", env.body.payload);
    await ldsGateway.handle(env);
  });

  // Adapter -> envelope
  const adapter = new FileIngestAdapter();
  const params = adapter.mapToEnvelopeParams(
    { path: "example.txt", content: "Hello MCP!" },
    {
      nodeId: "node-1",
      targetModuleId: "LDS",
      defaultSnapshotScope: "LIVE",
    }
  );

  const envelope = buildEnvelope(params, signer);

  console.log("Built envelope id:", envelope.header.envelopeId);

  // Route it
  await routeEnvelope(envelope, {
    routingTable,
    ioDispatcher,
    agentDispatcher,
    fedDispatcher,
  });

  // Show LDS ingest queue contents
  console.log("LDS ingest queue:", ingestQueue.peek());
}

main().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
