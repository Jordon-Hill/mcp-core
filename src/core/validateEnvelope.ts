import { MCPEnvelope } from "./envelope";

export function validateEnvelope(env: any): MCPEnvelope {
  const required = [
    "origin",
    "target",
    "timestamp",
    "trace_id",
    "payload",
    "intent",
    "side_effects",
    "schema_version",
  ];

  for (const key of required) {
    if (!(key in env)) {
      throw new Error(`MCPEnvelope missing required field: ${key}`);
    }
  }

  if (!["query", "action", "mutation"].includes(env.intent)) {
    throw new Error(`Invalid intent: ${env.intent}`);
  }

  if (!Array.isArray(env.side_effects)) {
    throw new Error("side_effects must be an array");
  }

  // Shallow type assertion – more can be added later.
  return env as MCPEnvelope;
}

