# Sovereign MCP Policy v1.0

## Purpose
Define the rules, guarantees, and operating boundaries of the Sovereign Model Context Protocol (MCP) used inside a Sovereign Node.

This policy applies to:
- MCP runtime
- Envelope engine
- Routing layer
- Module adapters
- Logging and provenance
- Tool invocation rules
- Deterministic state transitions

This policy is **non‑proprietary**, **user‑owned**, and **safe to reason about**.

---

## 1. Core Principles

### 1.1 Sovereign Ownership
- MCP is entirely user-owned.
- All execution, scheduling, routing, evaluation, and state transitions occur **locally**.
- No external cloud or proprietary system governs MCP logic.

### 1.2 Determinism
- All MCP envelopes must be:
  - Schema‑validated
  - Timestamped
  - Trace‑linked
  - Replayable
  - Append‑only (provenance guaranteed)

### 1.3 Safety
- No module may perform hidden state mutation.
- Every side‑effect must be declared in the envelope metadata.
- The user retains override authority over all MCP decisions.

### 1.4 Isolation Between Modules
- LDS Lite, Crystalline, Alignment, TKD, and Projections never share memory directly.
- MCP is the **only** integration channel.

---

## 2. MCP Envelope Specification (v1.0)

Each envelope contains:

```
{
  "origin": "module-id",
  "target": "module-id",
  "timestamp": "ISO-8601",
  "trace_id": "UUID",
  "payload": { ... },
  "intent": "query|action|mutation",
  "side_effects": ["write:crystalline", "append:alignment-log"],
  "schema_version": "1.0"
}
```

Rules:
- If side_effects is empty → envelope is pure.
- All mutating calls must use explicit side_effect declarations.
- Replay must reconstruct identical state.

---

## 3. Routing Rules

### 3.1 Single Runtime
- All module communication flows through `mcp-runtime`.

### 3.2 No Back-Channels
- Modules **cannot** call each other directly.
- Any discovered back‑channel invalidates the run.

### 3.3 Routing Logic
- Routing determined by:
  - `target`
  - module capability map
  - policy rules in this document

---

## 4. Logging & Provenance

- Every envelope is appended to:
  - `/logs/mcp-envelope-log.jsonl`
- Log is immutable.
- Log is used for:
  - replay
  - debugging
  - audit
  - TKD introspection

---

## 5. Execution Guarantees

- No envelope may skip schema validation.
- No module may mutate global state without MCP orchestration.
- Every envelope must receive:
  - a response envelope OR
  - a timeout fault OR
  - an explicit refusal

---

## 6. Prohibited Behaviours

- Silent failures
- Hidden state mutation
- Side-effects without declaration
- Cloud-dependent calls
- Non-replayable heuristics

---

## 7. Amendments
- Amendments require:
  - user approval
  - bump in `schema_version`
  - migration script generation


