import {
  MCPEnvelope,
  MCPHeader,
  MCPBody,
  MCPProvenance,
  MCPSafety,
} from "./types";
import { computeEnvelopeHash } from "./hashing";
import { validateEnvelope } from "./validation";

export interface EnvelopeSigner {
  sign(hash: string, envelope: MCPEnvelope): string;
}

export interface EnvelopeBuilderOptions {
  validateInput?: (params: EnvelopeBuildParams) => void;
  validateOutput?: typeof validateEnvelope;
}

export interface EnvelopeBuildParams {
  header: Omit<MCPHeader, "envelopeId"> & { envelopeId?: string };
  body: MCPBody;
  provenance: Omit<MCPProvenance, "hash" | "signature">;
  safety: MCPSafety;
}

export function buildEnvelope(
  params: EnvelopeBuildParams,
  signer: EnvelopeSigner,
  options: EnvelopeBuilderOptions = {}
): MCPEnvelope {
  const { validateInput, validateOutput = validateEnvelope } = options;

  if (validateInput) validateInput(params);

  const provisional: MCPEnvelope = {
    header: {
      ...params.header,
      envelopeId: params.header.envelopeId ?? "",
    },
    body: params.body,
    provenance: {
      ...params.provenance,
      hash: "",
      signature: "",
    },
    safety: params.safety,
  };

  const hash = computeEnvelopeHash(provisional);

  const finalHeader: MCPHeader = {
    ...provisional.header,
    envelopeId: params.header.envelopeId ?? hash,
  };

  const preSigned: MCPEnvelope = {
    header: finalHeader,
    body: provisional.body,
    provenance: {
      ...params.provenance,
      hash,
      signature: "",
    },
    safety: provisional.safety,
  };

  const signature = signer.sign(hash, preSigned);

  const finalEnvelope: MCPEnvelope = {
    ...preSigned,
    provenance: {
      ...preSigned.provenance,
      signature,
    },
  };

  validateOutput(finalEnvelope);
  return finalEnvelope;
}

