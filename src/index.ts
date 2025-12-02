import { dispatch } from "./runtime/router";
import type { MCPEnvelope } from "./core/envelope";
import * as crypto from "crypto";

async function main() {
  const envelope: MCPEnvelope = {
    origin: "cli",
    target: "alignment-engine",
    timestamp: new Date().toISOString(),
    trace_id: crypto.randomUUID(),
    intent: "query",
    side_effects: ["append:alignment-log"],
    schema_version: "1.0",
    payload: {
      position: { id: "pos1", facts: { x: 1 } },
      goals: { id: "goals1", goals: { profit: true } },
      values: { id: "values1", values: { sovereignty: true } },
    },
  };

  const res = await dispatch(envelope);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(res, null, 2));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("MCP Runtime error:", err);
  process.exit(1);
});

