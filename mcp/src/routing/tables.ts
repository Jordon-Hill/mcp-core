import { MCPRoutingTable, MCPRouteMap, MCPRouteTarget } from "../core/types";

export const emptyRouteMap: MCPRouteMap = {};

export const defaultRoutingTable: MCPRoutingTable = {
  io: { ...emptyRouteMap },
  agent: { ...emptyRouteMap },
  fed: { ...emptyRouteMap },
};

export function registerRoute(
  table: MCPRoutingTable,
  layer: "MCP-IO" | "MCP-AGENT" | "MCP-FED",
  payloadType: string,
  target: MCPRouteTarget
): MCPRoutingTable {
  const map =
    layer === "MCP-IO"
      ? table.io
      : layer === "MCP-AGENT"
      ? table.agent
      : table.fed;

  map[payloadType] = target;
  return table;
}

export function resolveRouteTarget(
  table: MCPRoutingTable,
  layer: "MCP-IO" | "MCP-AGENT" | "MCP-FED",
  payloadType: string
): MCPRouteTarget | undefined {
  const map =
    layer === "MCP-IO"
      ? table.io
      : layer === "MCP-AGENT"
      ? table.agent
      : table.fed;

  return map[payloadType];
}

