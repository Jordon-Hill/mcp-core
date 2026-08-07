import type {
  Identity,
  MCPMessage,
  Permission,
  ProvenanceEntry,
} from "./mcp/core/message";
import { routeMessage } from "./mcp/core/router";
import type { RouterContext, RoutingResult } from "./mcp/core/router";

export const MCP_PROTOCOL_VERSION_2026_07_28 = "2026-07-28" as const;

export interface MCP20260728ClientInfo {
  name: string;
  version: string;
}

export interface MCP20260728RequestMeta {
  "io.modelcontextprotocol/protocolVersion": typeof MCP_PROTOCOL_VERSION_2026_07_28;
  "io.modelcontextprotocol/clientInfo"?: MCP20260728ClientInfo;
  "io.modelcontextprotocol/clientCapabilities": Record<string, unknown>;
}

export type MCP20260728JSONRPCId = string | number;

export interface MCP20260728ReadOnlyToolCall {
  headers: {
    "MCP-Protocol-Version": typeof MCP_PROTOCOL_VERSION_2026_07_28;
    "Mcp-Method": "tools/call";
    "Mcp-Name": string;
  };
  body: {
    jsonrpc: "2.0";
    id: MCP20260728JSONRPCId;
    method: "tools/call";
    params: {
      name: string;
      arguments?: unknown;
      _meta: MCP20260728RequestMeta;
    };
  };
}

/**
 * Authority supplied by the Sovereign-owned application boundary.
 * Nothing in MCP transport metadata may populate or widen these fields.
 */
export interface SovereignBoundaryAuthority {
  caller: Identity;
  permissions: Permission[];
  provenance: ProvenanceEntry[];
}

export interface AdaptedStatelessReadOnlyCall {
  message: MCPMessage;
  transportMetadata: {
    protocolVersion: typeof MCP_PROTOCOL_VERSION_2026_07_28;
    clientInfo?: MCP20260728ClientInfo;
    clientCapabilities: Record<string, unknown>;
  };
  legacyCompatibility: {
    /**
     * Request-local compatibility marker for the legacy MessageContext.sessionId field.
     * It is never looked up, persisted, reused, or treated as an MCP protocol session.
     */
    requestScopedSessionId: string;
  };
}

function requireNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}

function requireHeaderBodyMatch(
  headerValue: string,
  bodyValue: string,
  label: string
): void {
  if (headerValue !== bodyValue) {
    throw new Error(`MCP 2026-07-28 header/body mismatch: ${label}`);
  }
}

function requestIdToken(id: MCP20260728JSONRPCId): string {
  if (typeof id === "number" && !Number.isFinite(id)) {
    throw new Error("JSON-RPC request id must be finite");
  }
  const token = String(id);
  requireNonEmpty(token, "JSON-RPC request id");
  return token;
}

/**
 * Adapts one self-contained MCP 2026-07-28 Streamable HTTP tools/call request
 * to the legacy internal MCPMessage shape without creating protocol session state.
 *
 * The final 2026-07-28 wire contract is represented explicitly:
 * - MCP-Protocol-Version mirrors _meta/io.modelcontextprotocol/protocolVersion;
 * - Mcp-Method mirrors the JSON-RPC method;
 * - Mcp-Name mirrors params.name;
 * - clientInfo/clientCapabilities are per-request _meta only.
 *
 * Transport metadata remains informational protocol context only. Caller identity,
 * permissions and provenance come exclusively from the Sovereign-owned authority
 * argument and are never derived from client-reported _meta.
 */
export function adaptStatelessReadOnlyToolCall20260728(
  request: MCP20260728ReadOnlyToolCall,
  authority: SovereignBoundaryAuthority,
  timestamp = new Date().toISOString()
): AdaptedStatelessReadOnlyCall {
  const { headers, body } = request;
  const meta = body.params._meta;

  if (headers["MCP-Protocol-Version"] !== MCP_PROTOCOL_VERSION_2026_07_28) {
    throw new Error(
      `Unsupported MCP protocol version: ${headers["MCP-Protocol-Version"]}`
    );
  }
  if (
    meta["io.modelcontextprotocol/protocolVersion"] !==
    MCP_PROTOCOL_VERSION_2026_07_28
  ) {
    throw new Error(
      `Unsupported MCP protocol version: ${String(
        meta["io.modelcontextprotocol/protocolVersion"]
      )}`
    );
  }

  if (body.jsonrpc !== "2.0") {
    throw new Error(`Unsupported JSON-RPC version: ${String(body.jsonrpc)}`);
  }
  if (body.method !== "tools/call") {
    throw new Error(`Unsupported MCP method: ${String(body.method)}`);
  }

  requireHeaderBodyMatch(
    headers["MCP-Protocol-Version"],
    meta["io.modelcontextprotocol/protocolVersion"],
    "protocol version"
  );
  requireHeaderBodyMatch(headers["Mcp-Method"], body.method, "method");
  requireHeaderBodyMatch(headers["Mcp-Name"], body.params.name, "name");

  requireNonEmpty(body.params.name, "tool name");
  requireNonEmpty(authority.caller.nodeId, "Sovereign caller nodeId");

  if (authority.provenance.length === 0) {
    throw new Error("Sovereign provenance must be non-empty");
  }

  const clientCapabilities =
    meta["io.modelcontextprotocol/clientCapabilities"];
  if (
    clientCapabilities === null ||
    typeof clientCapabilities !== "object" ||
    Array.isArray(clientCapabilities)
  ) {
    throw new Error("MCP clientCapabilities must be an object");
  }

  const clientInfo = meta["io.modelcontextprotocol/clientInfo"];
  if (clientInfo) {
    requireNonEmpty(clientInfo.name, "MCP clientInfo.name");
    requireNonEmpty(clientInfo.version, "MCP clientInfo.version");
  }

  const requestScopedSessionId = `mcp-2026-07-28-request:${requestIdToken(
    body.id
  )}`;

  const message: MCPMessage = {
    context: {
      caller: { ...authority.caller },
      sessionId: requestScopedSessionId,
      permissions: authority.permissions.map((permission) => ({ ...permission })),
      provenance: authority.provenance.map((entry) => ({ ...entry })),
      timestamp,
    },
    intent: "QUERY",
    payload: {
      schema: "mcp-2026-07-28-read-only-tool-call",
      schemaVersion: "1.0",
      content: {
        name: body.params.name,
        arguments: body.params.arguments,
      },
    },
  };

  const transportMetadata: AdaptedStatelessReadOnlyCall["transportMetadata"] = {
    protocolVersion: MCP_PROTOCOL_VERSION_2026_07_28,
    clientCapabilities: { ...clientCapabilities },
  };
  if (clientInfo) {
    transportMetadata.clientInfo = { ...clientInfo };
  }

  return {
    message,
    transportMetadata,
    legacyCompatibility: { requestScopedSessionId },
  };
}

/**
 * Smallest read-only proof seam: existing MCP -> Crystalline QUERY route.
 * The adapter itself performs no canonical or external mutation.
 */
export async function invokeStatelessReadOnlyQuery20260728(
  request: MCP20260728ReadOnlyToolCall,
  authority: SovereignBoundaryAuthority,
  ctx: RouterContext,
  timestamp?: string
): Promise<{ adapted: AdaptedStatelessReadOnlyCall; routing: RoutingResult }> {
  const adapted = adaptStatelessReadOnlyToolCall20260728(
    request,
    authority,
    timestamp
  );
  const routing = await routeMessage(adapted.message, "MCP", "CRYSTALLINE", ctx);
  return { adapted, routing };
}
