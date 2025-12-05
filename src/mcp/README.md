# MCP v1.1 Implementation

This directory contains the implementation of MCP v1.1 (Model Context Protocol) as specified in `docs/MCP_v1.1.md`.

## Overview

MCP v1.1 is the constitutional transport layer of the Sovereign System. It mediates all message flow between subsystems and agents, enforcing:
- deterministic routing
- explicit intent
- provenance tracking
- alignment and federated invariants

## Structure

### Core (`src/mcp/core/`)

- **`message.ts`**: Message model (context, intent, payload triple)
- **`routing.ts`**: Legal routing graph and route validation
- **`constraints.ts`**: Constitutional constraints enforcement
- **`alignment.ts`**: Alignment integration (forwarding, Judge rulings, Mediator halts)
- **`agents.ts`**: Agent orchestration interface
- **`federation.ts`**: Federation handshake implementation
- **`router.ts`**: Main router combining all components

### Interfaces (`src/mcp/interfaces/`)

Clean interfaces for subsystem callers:
- **`lds.ts`**: LDS interface
- **`tkd.ts`**: TKD interface
- **`alignment.ts`**: Alignment interface
- **`agents.ts`**: Agents interface
- **`projections.ts`**: Projections interface
- **`crystalline.ts`**: Crystalline (KG) interface

## Usage

### Basic Message Routing

```typescript
import { routeMessage, RouterContext } from "./core/router";
import { MCPMessage } from "./core/message";

const ctx: RouterContext = {
  currentNodeId: "local",
  routeHandler: async (message, to) => {
    // Handle routing to subsystem
  }
};

const result = await routeMessage(message, "MCP", "CRYSTALLINE", ctx);
```

### Using Subsystem Interfaces

```typescript
import { createLDSInterface } from "./interfaces/lds";
import { createRouterContext } from "./core/router";

const ctx = createRouterContext();
const lds = createLDSInterface(ctx);

await lds.sendToTKD(context, payload, "schema", "1.0");
```

## Legal Routing Graph

Only specific routes are permitted:
- `LDS → TKD → MCP → Crystalline`
- `MCP → Alignment` (Actor/Judge/Mediator)
- `MCP → Agents` (tool execution) under Alignment supervision
- `MCP → Projections` for scenario generation

Direct routes such as `Agents → KG` or `TKD → Agents` are disallowed.

## Constitutional Constraints

All routing decisions must respect:
1. **Non-coercion**: No action may reduce user or node sovereignty
2. **Locality**: No external authority can override a node
3. **Reversibility**: All non-constitutional state changes must be reversible
4. **Observability**: All operations must be fully observable and explainable

## Testing

Run tests with:
```bash
npm test
```

Tests are located in `tests/` directory and cover all core components.

## Notes

- This implementation does NOT implement LDS, TKD, Alignment, KG, or Projections themselves
- This is purely the transport layer as specified in MCP v1.1
- All code is deterministic, minimal, and testable
