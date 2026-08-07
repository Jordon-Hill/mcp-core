import assert from "node:assert/strict";
import {
  adaptStatelessReadOnlyToolCall20260728,
  invokeStatelessReadOnlyQuery20260728,
  MCP_2026_07_28_READ_ONLY_TOOL_NAME,
  MCP_PROTOCOL_VERSION_2026_07_28,
  type MCP20260728ReadOnlyToolCall,
  type SovereignBoundaryAuthority,
} from "../src/protocol20260728";
import type { RouterContext } from "../src/mcp/core/router";

async function main(): Promise<void> {
  const authority: SovereignBoundaryAuthority = {
    caller: {
      nodeId: "local",
      moduleId: "MCP",
    },
    permissions: [
      {
        resource: "crystalline:kg",
        action: "read",
      },
    ],
    provenance: [
      {
        nodeId: "local",
        moduleId: "MCP",
        timestamp: "2026-08-08T00:00:00.000Z",
      },
    ],
  };

  let routedQueries = 0;
  let mutationAttempts = 0;

  const ctx: RouterContext = {
    currentNodeId: "local",
    async routeHandler(message, to) {
      assert.equal(to, "CRYSTALLINE");
      assert.equal(message.intent, "QUERY");
      if (message.intent !== "QUERY") {
        mutationAttempts += 1;
      }
      routedQueries += 1;
    },
  };

  const makeRequest = (
    requestId: string,
    claimedCapabilities: Record<string, unknown>,
    includeClientInfo = true,
    toolName = MCP_2026_07_28_READ_ONLY_TOOL_NAME
  ): MCP20260728ReadOnlyToolCall => {
    const _meta: MCP20260728ReadOnlyToolCall["body"]["params"]["_meta"] = {
      "io.modelcontextprotocol/protocolVersion":
        MCP_PROTOCOL_VERSION_2026_07_28,
      "io.modelcontextprotocol/clientCapabilities": claimedCapabilities,
    };

    if (includeClientInfo) {
      _meta["io.modelcontextprotocol/clientInfo"] = {
        name: "untrusted-client-metadata",
        version: "1.0.0",
      };
    }

    return {
      headers: {
        "MCP-Protocol-Version": MCP_PROTOCOL_VERSION_2026_07_28,
        "Mcp-Method": "tools/call",
        "Mcp-Name": toolName,
      },
      body: {
        jsonrpc: "2.0",
        id: requestId,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: { subject: "compatibility-proof" },
          _meta,
        },
      },
    };
  };

  const first = await invokeStatelessReadOnlyQuery20260728(
    makeRequest("request-a", {
      canonicalMutation: true,
      operatorApproval: true,
      authenticatedIdentity: "pretend-admin",
    }),
    authority,
    ctx,
    "2026-08-08T00:00:01.000Z"
  );

  // clientInfo is optional/self-reported; absence must not create authority or state.
  const second = await invokeStatelessReadOnlyQuery20260728(
    makeRequest(
      "request-b",
      {
        canonicalMutation: false,
        unrelatedCapability: true,
      },
      false
    ),
    authority,
    ctx,
    "2026-08-08T00:00:02.000Z"
  );

  assert.equal(first.routing.success, true);
  assert.equal(second.routing.success, true);
  assert.equal(first.routing.routed, true);
  assert.equal(second.routing.routed, true);
  assert.equal(routedQueries, 2);
  assert.equal(mutationAttempts, 0);

  // No shared protocol session: each request has a request-local legacy marker.
  assert.notEqual(
    first.adapted.message.context.sessionId,
    second.adapted.message.context.sessionId
  );
  assert.equal(
    first.adapted.message.context.sessionId,
    "mcp-2026-07-28-request:request-a"
  );
  assert.equal(
    second.adapted.message.context.sessionId,
    "mcp-2026-07-28-request:request-b"
  );

  // Governed read-only meaning is equivalent despite independent protocol requests.
  assert.deepEqual(first.adapted.message.payload, second.adapted.message.payload);
  assert.deepEqual(first.adapted.message.context.caller, second.adapted.message.context.caller);
  assert.deepEqual(
    first.adapted.message.context.permissions,
    second.adapted.message.context.permissions
  );

  // Client-reported metadata stays transport-only and grants no Sovereign authority.
  assert.equal(first.adapted.message.context.caller.nodeId, "local");
  assert.equal(first.adapted.message.context.caller.moduleId, "MCP");
  assert.deepEqual(first.adapted.message.context.permissions, [
    { resource: "crystalline:kg", action: "read" },
  ]);
  assert.equal(
    first.adapted.transportMetadata.clientCapabilities.canonicalMutation,
    true
  );
  assert.equal(
    first.adapted.message.context.permissions.some(
      (permission) => permission.action !== "read"
    ),
    false
  );
  assert.equal(second.adapted.transportMetadata.clientInfo, undefined);

  // Final HTTP semantics require header/body routing metadata to agree.
  const mismatchedName = makeRequest("request-c", {});
  mismatchedName.headers["Mcp-Name"] = "different-tool";
  assert.throws(
    () => adaptStatelessReadOnlyToolCall20260728(mismatchedName, authority),
    /header\/body mismatch: name/
  );
  assert.equal(routedQueries, 2);

  // The seam is bound to exactly one application-owned read-only capability.
  // A header-consistent hostile/mutating-looking tool name must fail before routing.
  const unsupportedTool = makeRequest(
    "request-d",
    { canonicalMutation: true },
    true,
    "crystalline.mutate_everything"
  );
  assert.throws(
    () => adaptStatelessReadOnlyToolCall20260728(unsupportedTool, authority),
    /Unsupported read-only MCP tool/
  );
  assert.equal(routedQueries, 2);
  assert.equal(mutationAttempts, 0);

  console.log(
    "MCP_2026_07_28_STATELESS_READ_ONLY_BOUNDARY_PROOF_PASSED",
    JSON.stringify({
      routedQueries,
      mutationAttempts,
      firstSessionMarker: first.adapted.message.context.sessionId,
      secondSessionMarker: second.adapted.message.context.sessionId,
      headerBodyMismatchRejected: true,
      unsupportedToolRejected: true,
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
