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
  clientInfo?: MCP20260728ClientInfo;
  clientCapabilities?: Record<string, unknown>;
}

export interface MCP20260728ReadOnlyToolCall {
  protocolVersion: typeof MCP_PROTOCOL_VERSION_2026_07_28;
  requestId: string;
  method: "tools/call";
  name: string;
  arguments: unknown;
  meta?: MCP20260728RequestMeta;
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
    clientCapabilities?: Record<string, unknown>;
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

/**
 * Adapts one self-contained MCP 2026-07-28 read-only tools/call request to the
 * legacy internal MCPMessage shape without creating protocol session state.
 *
 * Transport clientInfo/clientCapabilities remain informational metadata only.
 * Caller identity, permissions and provenance come exclusively from the
 * Sovereign-owned authority argument.
 */
export function adaptStatelessReadOnlyToolCall20260728(
  request: MCP20260728ReadOnlyToolCall,
  authority: SovereignBoundaryAuthority,
  timestamp = new Date().toISOString()
): AdaptedStatelessReadOnlyCall {
  requireNonEmpty(request.requestId, "requestId");
  requireNonEmpty(request.name, "tool name");
  requireNonEmpty(authority.caller.nodeId, "Sovereign caller nodeId");

  if (authority.provenance.length === 0) {
    throw new Error("Sovereign provenance must be non-empty");
  }

  const requestScopedSessionId = `mcp-2026-07-28-request:${request.requestId}`;

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
        name: request.name,
        arguments: request.arguments,
      },
    },
  };

  const transportMetadata: AdaptedStatelessReadOnlyCall["transportMetadata"] = {
    protocolVersion: MCP_PROTOCOL_VERSION_2026_07_28,
  };
  if (request.meta?.clientInfo) {
    transportMetadata.clientInfo = { ...request.meta.clientInfo };
  }
  if (request.meta?.clientCapabilities) {
    transportMetadata.clientCapabilities = { ...request.meta.clientCapabilities };
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
