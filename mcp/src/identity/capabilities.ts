import { Capability, MCPEnvelope } from "../core/types";

export function enforceCapabilities(envelope: MCPEnvelope): void {
  const { declared, required } = envelope.header.capabilities;
  if (!required || required.length === 0) return;

  const declaredIds = new Set(declared.map((c) => c.id));

  for (const need of required) {
    if (!declaredIds.has(need.id)) {
      throw new Error(`Capability enforcement failed: missing "${need.id}"`);
    }
  }
}

