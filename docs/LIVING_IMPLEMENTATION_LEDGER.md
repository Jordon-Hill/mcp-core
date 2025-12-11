# Living Implementation Ledger

This document tracks the implementation status of MCP Core components.

## IMP-011 — MCP Log Store v1

- **Subsystem**: MCP Core
- **Plateau/Wall**: P1
- **Status**: DONE (v1, no tests)
- **Note**: Core append-only log store implemented with hash chain + JSONL persistence and replay API. Next related step is IMP-013 (MCP Test Harness) to prove determinism/replay.
- **Location**: `src/mcp/log_store.ts`
