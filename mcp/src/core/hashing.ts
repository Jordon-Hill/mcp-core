import crypto from "crypto";
import { MCPEnvelope } from "./types";

const EXCLUDE_FROM_HASH = new Set(["hash", "signature", "envelopeId"]);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        if (EXCLUDE_FROM_HASH.has(key)) return;
        const v = obj[key];
        if (v === undefined) return;
        sorted[key] = canonicalize(v);
      });
    return sorted;
  }

  return value;
}

export function canonicalSerializeForHash(envelope: MCPEnvelope): string {
  return JSON.stringify(canonicalize(envelope));
}

export function computeEnvelopeHash(envelope: MCPEnvelope): string {
  const serialized = canonicalSerializeForHash(envelope);
  return crypto.createHash("sha256").update(serialized, "utf8").digest("hex");
}

