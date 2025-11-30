import { MCPEnvelope, MCPRoutingTable } from "../src/core/types";
import { defaultRoutingTable, registerRoute } from "../src/routing/tables";
import { IODispatcher } from "../src/routing/ioDispatcher";
import { AgentDispatcher } from "../src/routing/agentDispatcher";
import { FedDispatcher } from "../src/routing/fedDispatcher";
import { routeEnvelope } from "../src/routing/router";

function makeEnv(layer: "MCP-IO" | "MCP-AGENT" | "MCP-FED"): MCPEnvelope {
  return {
    header: {
      envelopeId: "env-1",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      layer,
      type: "REQUEST",
      source: { nodeId: "node-1" },
      target: { nodeId: "node-1" },
      capabilities: { declared: [] },
    },
    body: { payloadType: "TEST.ROUTE", payload: {} },
    provenance: { route: [], hash: "h", signature: "s" },
    safety: { snapshotScope: "LIVE" },
  };
}

describe("Router", () => {
  test("routes to IO handler", async () => {
    const table: MCPRoutingTable = JSON.parse(JSON.stringify(defaultRoutingTable));
    registerRoute(table, "MCP-IO", "TEST.ROUTE", {
      targetModule: "LDS",
      handler: "handleTest",
    });

    const io = new IODispatcher();
    const ag = new AgentDispatcher();
    const fd = new FedDispatcher();

    let hit = false;
    io.registerHandler("handleTest", () => {
      hit = true;
    });

    await routeEnvelope(makeEnv("MCP-IO"), { routingTable: table, ioDispatcher: io, agentDispatcher: ag, fedDispatcher: fd });

    expect(hit).toBe(true);
  });

  test("throws on missing route", async () => {
    const table: MCPRoutingTable = JSON.parse(JSON.stringify(defaultRoutingTable));
    const io = new IODispatcher();
    const ag = new AgentDispatcher();
    const fd = new FedDispatcher();

    await expect(
      routeEnvelope(makeEnv("MCP-AGENT"), { routingTable: table, ioDispatcher: io, agentDispatcher: ag, fedDispatcher: fd })
    ).rejects.toThrow(/no route/);
  });
});

