import { MCPEnvelope } from "./types";
import { computeEnvelopeHash } from "./hashing";

export interface EnvelopeVerifier {
  verify(hash: string, signature: string, envelope: MCPEnvelope): boolean;
}

export class MCPValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MCPValidationError";
  }
}

export function validateEnvelopeStructure(envelope: MCPEnvelope): void {
  if (!envelope.header) throw new MCPValidationError("Missing header");
  if (!envelope.body) throw new MCPValidationError("Missing body");
  if (!envelope.provenance) throw new MCPValidationError("Missing provenance");
  if (!envelope.safety) throw new MCPValidationError("Missing safety");

  if (!envelope.header.timestamp) {
    throw new MCPValidationError("Header.timestamp is required");
  }

  if (!envelope.provenance.hash) {
    throw new MCPValidationError("Provenance.hash is required");
  }

  if (!envelope.provenance.signature) {
    throw new MCPValidationError("Provenance.signature is required");
  }
}

export function validateEnvelopeCrypto(
  envelope: MCPEnvelope,
  verifier?: EnvelopeVerifier
): void {
  const recomputed = computeEnvelopeHash(envelope);
  if (recomputed !== envelope.provenance.hash) {
    throw new MCPValidationError("Envelope hash mismatch");
  }

  if (verifier) {
    const ok = verifier.verify(
      envelope.provenance.hash,
      envelope.provenance.signature,
      envelope
    );
    if (!ok) throw new MCPValidationError("Envelope signature verification failed");
  }
}

export function validateEnvelope(
  envelope: MCPEnvelope,
  verifier?: EnvelopeVerifier
): void {
  validateEnvelopeStructure(envelope);
  validateEnvelopeCrypto(envelope, verifier);
}

