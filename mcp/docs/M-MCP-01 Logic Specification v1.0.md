# M-MCP-01 --- Sovereign MCP

Logic Specification v1.0

## Preface

This document defines the canonical, unified Model Context Protocol
(MCP) for the Sovereign System.\
It is the authoritative reference for all MCP-related implementation
work.

------------------------------------------------------------------------

## §1 Purpose & Scope

The Sovereign MCP is the unified message substrate for the Sovereign
Node. It defines: - a single envelope format, - a single identity +
signature model, - a universal routing + provenance ontology, - modules
for IO, internal routing, and federated exchange.

MCP is a deterministic transport + contract layer, not a cognitive
layer.

------------------------------------------------------------------------

## §2 Position in Sovereign Architecture

MCP sits below cognition and above raw transport: - Below: TCP/HTTP,
queues, IPC. - Above: LDS Lite, Crystalline, TKD, Alignment, Financial
Engine, Agents.

All modules exchange context exclusively via MCP envelopes.

------------------------------------------------------------------------

## §3 Core Concepts & Invariants

### 3.1 Entities

-   Node\
-   Module\
-   Agent\
-   Adapter

### 3.2 Invariants

1.  Sovereignty\
2.  Determinism\
3.  Provenance\
4.  Non-learning transport\
5.  Local-first operation

------------------------------------------------------------------------

## §4 Unified MCP Envelope

### 4.1 Envelope Structure

Header: id, timestamp, version, layer, type, priority, source, target,
capabilities\
Body: payloadType, payload\
Provenance: route, hash, signature, contextRefs\
Safety: snapshotScope, alignmentFlags, riskLevel

### 4.2 Hash & ID Rules

All envelopes must be uniquely identified and signed deterministically.

### 4.3 Message Types

REQUEST, RESPONSE, EVENT, COMMAND, PATTERN_OFFER, SNAPSHOT_OFFER,
RULE_DELTA, ALERT

------------------------------------------------------------------------

## §5 Identity & Signing (MCP-ID)

Node, Module, and Agent identities.\
All envelopes are signed by source node (and optionally module/agent).\
Capability scopes declared explicitly.

------------------------------------------------------------------------

## §6 MCP-IO (External → LDS)

Adapters transform external data (email, bank, ATO, sensors,
marketplaces) into MCP envelopes targeted at LDS.\
Replayable, stateless, deterministic.\
No direct writes to DBs --- LDS processes envelopes.

------------------------------------------------------------------------

## §7 MCP-AGENT (Internal Routing)

Routes messages between LDS, Crystalline, TKD, Alignment, Financial
Engine, Agents.\
Routing is table-driven; no ad-hoc flows.\
Snapshot scopes and alignment flags guard actions.

------------------------------------------------------------------------

## §8 MCP-FED (Federated Transport)

Cross-node exchange of: - SnapshotRefs\
- PatternRefs / RuleDeltas\
- Alignment summary signals

Federation is optional, sovereignty-preserving, signed, policy-governed.

------------------------------------------------------------------------

## §9 Error Model

ERROR.TRANSPORT, ERROR.VALIDATION, ERROR.AUTH, ERROR.SAFETY,
ERROR.INTERNAL.\
All errors returned in RESPONSE.Error envelopes with correlation ID.

------------------------------------------------------------------------

## §10 Integration Summary

MCP provides transport only.\
Behavioural semantics are defined in: - M-LDS-01\
- M-KG-01\
- M-TKD-01\
- M-ALIGN-01\
- M-FIN-01\
- M-AGENT-01\
- M-FED-01

MCP is the universal backbone connecting all modules.

------------------------------------------------------------------------

