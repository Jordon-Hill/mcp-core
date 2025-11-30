🧩 MCP Demo Matrix — Sovereign MCP v0

This document summarizes every working demo in the MCP runtime and what each demonstrates.

It is your at-a-glance map of the entire transport substrate.

All demos run with:

npx ts-node scripts/<demo>.ts

⸻

✅ 1. File Ingest → LDS Pipeline

Script: demoFileIngest.ts

Layer: MCP-IO

Payload: LDS.INGEST.FILE

What it proves

	•	External data can be ingested through an MCP-IO Adapter

	•	Envelope construction (hash + signature) works

	•	MCP-IO routing works

	•	IO Dispatcher → LDS Gateway → LDS Ingest Queue

	•	LDS Processor v0 can drain & log ingest records

Flow

Adapter → EnvelopeBuilder → Signer → Router → IO Dispatcher → QueueLdsGateway → InMemoryLdsIngestQueue → LdsIngestProcessor

Why it matters

This establishes the entry point for all real-world data into the Sovereign Node

(invoices, files, email, sensors, logs, ATO streams, etc).

⸻

✅ 2. Alignment v0 (Hybrid) — Eval Request + Result

Script: demoAlignmentEval.ts

Layer: MCP-AGENT

Payloads:

	•	ALIGN.EVAL.REQUEST

	•	ALIGN.EVAL.RESULT

What it proves

	•	MCP-AGENT routing for Alignment

	•	Alignment Gateway reachable via MCP

	•	Dummy triad evaluation runs

	•	Result envelope is produced (score, flags, traceId)

	•	Full request → route → evaluate → response pattern

Flow

Client → MCP-AGENT → DemoAlignmentGateway → (dummy triad) → Eval Result → Client

Why it matters

Alignment Engine depends entirely on MCP—this proves the Pattern-of-Life loop

(Position/Goal/Value → Evaluate → Reflect) already has a substrate.

⸻

✅ 3. Agents v0 (Hybrid) — Deterministic Procedure Execution

Script: demoAgentExecute.ts

Layer: MCP-AGENT

Payloads:

	•	AGENT.EXECUTE.PROCEDURE

	•	AGENT.EVENT.STARTED

	•	AGENT.EVENT.COMPLETED

What it proves

	•	Deterministic procedure execution contracts

	•	Agents Gateway reachable through MCP

	•	STARTED + COMPLETED events emitted

	•	Provenance preserved across multi-envelope lifecycle

Flow

Execute Command → MCP-AGENT → DemoAgentsGateway → STARTED event → COMPLETED event

Why it matters

Agents are the action layer of the Sovereign Node.

All automation, ATO lodgements, financial tasks, operational procedures → flow through this pattern.

⸻

✅ 4. Crystalline Snapshot Request/Response v0

Script: demoCrystallineSnapshot.ts

Layer: MCP-AGENT

Payloads:

	•	CRYS.SNAPSHOT.REQUEST

	•	CRYS.SNAPSHOT.RESPONSE

What it proves

	•	Crystalline Gateway reachable

	•	Snapshot request envelope flows correctly

	•	Dummy metadata & kgRef returned

	•	Establishes the KG Snapshot Protocol

Flow

Client → MCP-AGENT → DemoCrystallineGateway → Snapshot Response → Client

Why it matters

Crystalline is your memory + KG layer.

Every subsystem (Agents, Alignment, TKD) must pull snapshots deterministically.

This proves the contract.

⸻

✅ 5. Federation Handshake v0 — Snapshot Offer + Alignment Summary

Script: demoFederationHandshake.ts

Layer: MCP-FED

Payloads:

	•	FED.SNAPSHOT.OFFER

	•	FED.ALIGNMENT.SUMMARY

What it proves

	•	Cross-node communication using MCP-FED layer

	•	Node A → Node B routing

	•	Receiving node generates alignment summary

	•	Provenance across nodes preserved

Flow

Node A (offer) → MCP-FED → Node B → DemoFederationGateway → Alignment Summary

Why it matters

This is the foundation of the federated network —

nodes exchange only:

	•	snapshots (sealed),

	•	pattern deltas,

	•	alignment summaries,

never raw data.

This is your anti-centralisation backbone.

⸻

🧬 Relationships Between Demos

         ┌─────────────────┐

         │  External Data  │

         └────────┬────────┘

                  │  MCP-IO

                  ▼

        [demoFileIngest.ts]

                  │

                  ▼

       LDS Queue → LDS Processor

            ┌────────────────────┐

            │   AGENT CLIENT     │

            └─────────┬──────────┘

                      │ MCP-AGENT

       ┌──────────────┼────────────────┐

       ▼              ▼                ▼

Alignment Demo   Agent Execute     Crystalline Snapshot

   Node A ── MCP-FED ──► Node B

  (offer)             (summary)

⸻

🧱 What This Means Strategically

With these demos running, you've already built:

✔ A sovereign, deterministic transport substrate

✔ Real envelope flows across all three MCP layers:

	•	MCP-IO (input)

	•	MCP-AGENT (internal logic)

	•	MCP-FED (federation)

✔ Proven request/response, command/event, and cross-node patterns

✔ A working "nervous system" for the whole Sovereign System

✔ A stable foundation for LDS Lite, Crystalline Engine, Alignment, TKD, Agents & Federation

Nothing is theoretical — everything is executable now.

