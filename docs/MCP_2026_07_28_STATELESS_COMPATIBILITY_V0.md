# MCP 2026-07-28 Stateless Compatibility v0

Status: bounded protocol-boundary compatibility receipt  
Date: 2026-08-08  
Repository: `Jordon-Hill/mcp-core`  
Audited main: `fc7fb3b71d71e1067749e1208bac01865b54f4a0`  
Outcome classification: `small_adapter_required`

## Final protocol boundary

The finalized MCP `2026-07-28` protocol removes the old `initialize` / `initialized` lifecycle and `Mcp-Session-Id` protocol session. Requests are self-contained. For the bounded Streamable HTTP seam used here, protocol/client metadata is carried per request and mirrored routing headers must agree with the request body.

This validates rather than replaces Sovereign-owned durable workflow state and authority separation.

```text
MCP transport metadata
≠ authenticated identity
≠ capability authority
≠ operator approval
≠ canonical mutation authority
```

Durable state remains in Sovereign-owned task, receipt or application state, never in an MCP connection.

## Audit findings

Inspected:

- `src/mcp/core/message.ts` — legacy `MessageContext.sessionId`, caller identity, permissions and provenance;
- `src/mcp/core/constraints.ts` — legacy observability requires non-empty `sessionId`;
- `src/mcp/core/router.ts` / `routing.ts` — existing `MCP -> CRYSTALLINE / QUERY` route;
- `src/mcp/core/agents.ts` — internal caller metadata assumptions;
- `src/mcp/core/federation.ts` — legacy Sovereign federation handshake/capability vocabulary;
- `src/mcp/core/alignment.ts` — no persistent-session sampling/elicitation/roots transport implementation found;
- `docs/MCP_v1.1.md` — legacy session/federation doctrine;
- current repository source/history for `initialize`, `Mcp-Session-Id`, sticky connection/session state and server-initiated transport assumptions.

Not found:

- no `initialize` / `initialized` wire implementation;
- no `Mcp-Session-Id` handling;
- no sticky connection map or MCP session store;
- no persistent-session server-initiated transport implementation.

Found:

1. legacy internal `MessageContext.sessionId` is mandatory;
2. observability rejects an empty `sessionId`;
3. identity and permissions are carried inside the legacy message context and therefore must never be populated from untrusted MCP client metadata;
4. legacy federation identity/capability negotiation is not authenticated MCP transport authority.

These findings are an isolated boundary mismatch, not a stateful MCP transport architecture.

## Implemented bounded adapter

`src/protocol20260728.ts` implements one stateless read-only seam only.

The supported application-owned tool is exactly:

```text
crystalline.read_only_query
```

The adapter validates:

```text
MCP-Protocol-Version
↔ _meta[io.modelcontextprotocol/protocolVersion]

Mcp-Method
↔ JSON-RPC method

Mcp-Name
↔ params.name

params.name
= crystalline.read_only_query
```

Any other header-consistent tool name is rejected before `routeMessage`.

The adapter also:

- accepts one self-contained request at a time;
- creates no MCP session store, lookup or sticky connection;
- accepts final per-request protocol/client metadata only as transport metadata;
- receives caller identity, permissions and provenance separately through `SovereignBoundaryAuthority`;
- maps the single trusted read-only capability to the existing internal `QUERY` route;
- supplies only a request-local compatibility marker for legacy `MessageContext.sessionId`;
- performs no canonical or external mutation.

The request-local marker is not an MCP session, durable workflow state, authenticated identity or authority token.

## Exact-head review repairs

### Review repair 1 — finalized wire shape

The first draft modeled a simplified normalized request. Review caught that the final wire boundary needed the reserved per-request metadata and required Streamable HTTP header/body mirrors. The adapter was narrowed to that final-format boundary and mismatch rejection was added.

### Review repair 2 — explicit read-only tool binding

Independent review at exact head `1bb2a39c9cb7ad3f1b3365067c037e7de71bae42` found that a header-consistent arbitrary `tools/call` name could still be forced into internal `QUERY`.

The repair binds the adapter to exactly `crystalline.read_only_query`. A different tool name now fails before routing, even when `Mcp-Name` and `params.name` agree.

No orchestration, federation, canonical-authority, application-state or Crystalline route redesign was introduced.

## Focused proof

`scripts/verify_mcp_2026_07_28.ts` exercises:

```text
request A
→ final-format read-only tools/call
→ existing MCP -> CRYSTALLINE QUERY route

request B
→ independent request id / no shared protocol session
→ equivalent governed result

client metadata claims mutation / approval / identity authority
→ remains transport metadata only
→ Sovereign caller and read-only permission remain unchanged

Mcp-Name differs from params.name
→ rejected before routing

header-consistent mutating-looking tool name
→ rejected before routing

all accepted calls
→ zero canonical/external mutation
```

Expected focused marker:

```text
MCP_2026_07_28_STATELESS_READ_ONLY_BOUNDARY_PROOF_PASSED
routedQueries=2
mutationAttempts=0
headerBodyMismatchRejected=true
unsupportedToolRejected=true
```

## Legacy compatibility

Do not broadly rewrite the legacy internal MCP model in this pass.

The old federation handshake/capability vocabulary remains legacy Sovereign code and is not adopted as MCP `2026-07-28` transport identity or authorization. Any later federation activation requires its own bounded identity/authentication/capability proof.

## Validation posture

- focused stateless/read-only proof: required;
- TypeScript build/typecheck: required where dependencies are available;
- existing repository tests: required where dependencies are available;
- GitHub currently reports no CI checks for this repository/PR;
- environments without dependency/network access must report that limitation rather than claim a full clean test run.

## MIP treatment

Active Crystalline MIP route changed: **no**.

This task validates the `mcp-core` protocol boundary only. It does not displace the active operational/security route, move application state into MCP, adopt A2A, add enterprise authorization or change canonical authority.

## Next smallest action

Run/review the repaired exact head. A genuinely independent exact-head review must pass before the human operator considers Merge. Then stop.
