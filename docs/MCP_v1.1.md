# MCP v1.1 — Model Context Protocol

## Purpose
MCP is the constitutional transport layer of the Sovereign System. It mediates *all* message flow between subsystems and agents, enforcing:
- deterministic routing,
- explicit intent,
- provenance tracking,
- alignment and federated invariants.

No module may bypass MCP.

## Message Model
Each message is a triple:
- `context` (caller identity, session state, permissions, provenance),
- `intent` (high-level purpose, e.g. ANALYSIS, PATTERN_EXTRACTION, KG_MUTATION_PROPOSAL),
- `payload` (typed, schema-declared content).

Free-form, untyped payloads are forbidden.

## Legal Routing Graph
Only specific routes are permitted, e.g.:
- LDS → TKD → MCP → Crystalline,
- MCP → Alignment (Actor/Judge/Mediator),
- MCP → Agents (tool execution) under Alignment supervision,
- MCP → Projections for scenario generation.

Direct routes such as “Agents → KG” or “TKD → Agents” are disallowed.

## Constitutional Constraints
Routing decisions must:
- respect non-coercion (no action may reduce user or node sovereignty),
- preserve locality (no external authority can override a node),
- ensure reversibility of all non-constitutional state changes,
- remain fully observable and explainable.

Any attempted route that violates invariants must be halted by the Mediator (Alignment Engine).

## Alignment and MCP
MCP is responsible for:
- forwarding requests for constitutional review,
- applying Judge rulings,
- enforcing Mediator halts or modifications,
- ensuring no subsystem can sidestep Alignment.

## Agent Orchestration
Agents:
- are invoked only via MCP,
- operate on scoped tasks,
- must be fully auditable and reversible,
- cannot modify LDS or the KG,
- cannot spawn recursively outside MCP rules.

## Federation
MCP also implements the federated handshake:
- node identity verification,
- capability negotiation,
- alignment and autonomy compatibility checks,
- partial, voluntary synchronisation only.

Remote override or coercive topologies are forbidden by design.

MCP v1.1 is thus the “nervous system” of the Sovereign Node, ensuring that all communication respects the constitution of the system.
