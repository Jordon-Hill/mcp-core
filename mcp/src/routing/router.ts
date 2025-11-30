import { MCPEnvelope, MCPRoutingTable } from "../core/types";
import { IODispatcher } from "./ioDispatcher";
import { AgentDispatcher } from "./agentDispatcher";
import { FedDispatcher } from "./fedDispatcher";
import { resolveRouteTarget } from "./tables";

export interface RouterContext {
  routingTable: MCPRoutingTable;
  ioDispatcher: IODispatcher;
  agentDispatcher: AgentDispatcher;
  fedDispatcher: FedDispatcher;
}

export async function routeEnvelope(
  envelope: MCPEnvelope,
  ctx: RouterContext
): Promise<void> {
  const { header, body } = envelope;
  const layer = header.layer;
  const payloadType = body.payloadType;

  const target = resolveRouteTarget(ctx.routingTable, layer, payloadType);
  if (!target) {
    throw new Error(`Router: no route for layer="${layer}" payload="${payloadType}"`);
  }

  switch (layer) {
    case "MCP-IO":
      return ctx.ioDispatcher.dispatch(envelope, target);
    case "MCP-AGENT":
      return ctx.agentDispatcher.dispatch(envelope, target);
    case "MCP-FED":
      return ctx.fedDispatcher.dispatch(envelope, target);
    default:
      throw new Error(`Router: unsupported layer "${layer}"`);
  }
}

