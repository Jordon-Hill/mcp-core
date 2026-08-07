# MCP 2026-07-28 Stateless Compatibility v0

Status: bounded protocol-boundary compatibility receipt  
Date: 2026-08-08  
Repository: `Jordon-Hill/mcp-core`  
Audited main: `fc7fb3b71d71e1067749e1208bac01865b54f4a0`  
Outcome classification: `small_adapter_required`

## Final upstream change

The finalized Model Context Protocol specification dated `2026-07-28` removes the `initialize` / `initialized` handshake and the `Mcp-Session-Id` protocol session. Requests are self-contained and carry protocol/client metadata per request. Server-to-client interactions are restructured around stateless request/response mechanisms such as MRTR rather than requiring a held-open protocol session.

This change validates rather than replaces Sovereign-owned durable state and authority separation.

```text
MCP transport metadata
≠ authenticated identity
≠ capability authority
≠ operator approval
≠ canonical mutation authority
```

Durable workflow state remains in Sovereign-owned task, receipt or application state, never in an MCP connection.

## Files and symbols inspected

- `src/index.ts` — package public root before this pass exported only `MCPEnvelope` types.
- `src/mcp/core/message.ts` — `MessageContext`, including required legacy `sessionId`, caller identity and permissions.
- `src/mcp/core/constraints.ts` — `validateConstitutionalConstraints` / `violatesObservability`; legacy observability requires a non-empty `sessionId`.
- `src/mcp/core/router.ts` — `routeMessage`; existing read-only `MCP -> CRYSTALLINE / QUERY` route selected for the proof.
- `src/mcp/core/routing.ts` — legal route graph.
- `src/mcp/core/agents.ts` — `validateAgentExecution`; caller `moduleId === "MCP"` is treated as an internal invocation invariant.
- `src/mcp/core/federation.ts` — `performFederationHandshake`, `verifyNodeIdentity`, `negotiateCapabilities`; legacy Sovereign federation model includes handshake/capability concepts that must not be confused with MCP 2026-07-28 transport metadata.
- `src/mcp/core/alignment.ts` — internal alignment forwarding/review logic; no MCP server-initiated sampling/elicitation/roots transport implementation found.
- `docs/MCP_v1.1.md` — legacy architecture describes session state and a federated handshake.
- current repository history/source search for `initialize`, `Mcp-Session-Id`, sticky connection state, sampling, elicitation and roots.

## Session-state dependencies found

### Not found

- no `initialize` or `initialized` wire-handshake implementation;
- no `Mcp-Session-Id` header handling;
- no connection registry, sticky-connection map or protocol-session store;
- no server-initiated `sampling/createMessage`, `elicitation/create` or `roots/list` transport implementation.

### Found

1. `MessageContext.sessionId` is mandatory in the legacy internal message model.
2. `violatesObservability` rejects messages when that field is empty, and existing tests expect this behaviour.
3. legacy documentation describes the context as containing session state.
4. internal caller identity and permissions travel inside `MessageContext`; some internal guards rely on those values.
5. the legacy federation module describes MCP-owned node identity verification and capability negotiation. Its current verification is structural placeholder logic, not authenticated identity proof.

These findings are a boundary mismatch, not evidence that the current package maintains an actual sticky MCP transport session.

## Compatibility decision

`small_adapter_required`

A general migration is not required because the current repository has no actual stateful MCP wire transport to replace. The exact incompatibility is the legacy internal context shape and the risk of conflating per-request MCP client metadata with Sovereign authority fields.

Legacy internals are retained for compatibility. The new boundary adapter is deliberately one-way and read-only for this proof.

## Implemented seam

`src/protocol20260728.ts` adds a bounded adapter for one self-contained MCP 2026-07-28 read-only `tools/call` request.

The adapter:

- accepts one request at a time with no shared protocol session;
- keeps client info/capabilities as informational `transportMetadata` only;
- requires caller identity, permissions and provenance as a separate `SovereignBoundaryAuthority` argument;
- maps only to the existing internal `QUERY` intent;
- supplies a request-local legacy compatibility marker for `MessageContext.sessionId` so the existing observability contract remains intact without a session store, lookup, reuse or sticky routing;
- performs no canonical or external mutation itself;
- invokes only the existing `MCP -> CRYSTALLINE / QUERY` route in the bounded proof helper.

`src/index.ts` exports this boundary without exporting the whole legacy `src/mcp` implementation.

`scripts/verify_mcp_2026_07_28.ts` is the deterministic proof command exposed as:

```text
npm run verify:mcp-2026-07-28
```

## Smallest proof result

The proof invokes the same read-only capability twice with independent request identities and no shared protocol session.

Observed acceptance conditions:

```text
first stateless request
→ existing MCP -> CRYSTALLINE QUERY route succeeds
second stateless request with different request-local marker
→ same governed QUERY payload succeeds
→ no shared session marker
→ caller identity remains Sovereign-supplied
→ permissions remain Sovereign-supplied read-only permissions
→ client-reported metadata claiming mutation/approval/identity authority is retained only as metadata
→ zero mutation attempts
```

Isolated TypeScript execution result:

```text
MCP_2026_07_28_STATELESS_READ_ONLY_BOUNDARY_PROOF_PASSED
routedQueries=2
mutationAttempts=0
```

## Legacy compatibility disposition

Do not delete or broadly rewrite the legacy `src/mcp` model in this pass.

In particular, `performFederationHandshake` and the legacy federation capability vocabulary are not adopted as MCP 2026-07-28 protocol handshake or transport authorization. If that federation path is later activated, it requires its own owner-level identity/authentication/capability proof; client `_meta` must not satisfy it.

The request-local `sessionId` compatibility marker is temporary legacy-shape accommodation, not durable workflow state and not an MCP session. A later cleanup may rename/remove it only when current internal consumers and tests can be migrated without widening this task.

## MIP treatment

No active MIP route change is required or made.

Concise route doctrine for any later MIP note:

- MCP 2026-07-28 is final;
- stateless protocol compatibility is proved at the `mcp-core` boundary;
- this validates rather than replaces Sovereign-owned durable state and authority separation;
- it does not displace the active operational vertical.

No A2A adoption, enterprise authorization programme, orchestration redesign, application-state migration into MCP or canonical-authority change is included.

## Next smallest action

Review this exact bounded branch/PR. If accepted, merge the adapter and receipt. Then stop. Revisit legacy federation/session naming only when a real consumer or transport activation requires it.
