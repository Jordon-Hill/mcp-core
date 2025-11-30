import {
  MCPEnvelope,
  MCPErrorClass,
  MCPErrorBody,
  MCPIdentityRef,
  MCPBody,
  MCPSafety,
  MCPProvenance

} from "./types";
import {
  EnvelopeBuildParams,
  buildEnvelope,
  EnvelopeSigner,
  EnvelopeBuilderOptions

} from "./envelope";

export function createErrorBody(
  errorClass: MCPErrorClass,
  message: string,
  correlationId: string,
  details?: unknown
): MCPErrorBody {
  return { errorClass, message, correlationId, details };
}

export function buildErrorEnvelopeParams(
  original: MCPEnvelope,
  emitting: MCPIdentityRef,
  errorClass: MCPErrorClass,
  message: string,
  details?: unknown
): EnvelopeBuildParams {
  const correlationId = original.header.envelopeId;

  const header: EnvelopeBuildParams["header"] = {
    timestamp: new Date().toISOString(),
    version: original.header.version,
    layer: original.header.layer,
    type: "RESPONSE",
    priority: original.header.priority ?? "NORMAL",
    source: emitting,
    target: original.header.source,
    capabilities: { declared: [] },
  };

  const body: MCPBody = {
    payloadType: "MCP.ERROR",
    payload: createErrorBody(errorClass, message, correlationId, details),
  };

  const now = new Date().toISOString();
  const provenance: Omit<MCPProvenance, "hash" | "signature"> = {
    route: [
      ...(original.provenance.route ?? []),
      {
        nodeId: emitting.nodeId,
        moduleId: emitting.moduleId,
        agentId: emitting.agentId,
        timestamp: now,
      },
    ],
    contextRefs: [
      ...(original.provenance.contextRefs ?? []),
      original.header.envelopeId,
    ],
  };

  const safety: MCPSafety = {
    snapshotScope: original.safety.snapshotScope,
    alignmentFlags: original.safety.alignmentFlags,
    riskLevel: original.safety.riskLevel ?? "LOW",
  };

  return { header, body, provenance, safety };
}

export function buildErrorEnvelope(
  original: MCPEnvelope,
  emitting: MCPIdentityRef,
  signer: EnvelopeSigner,
  errorClass: MCPErrorClass,
  message: string,
  details?: unknown,
  options: EnvelopeBuilderOptions = {}
): MCPEnvelope {
  const params = buildErrorEnvelopeParams(
    original,
    emitting,
    errorClass,
    message,
    details
  );
  return buildEnvelope(params, signer, options);
}

