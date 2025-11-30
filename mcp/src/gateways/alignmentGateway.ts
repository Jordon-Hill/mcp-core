import { MCPEnvelope, MCPIdentityRef } from "../core/types";
import {
  ALIGN_EVAL_REQUEST,
  ALIGN_EVAL_RESULT,
  AlignmentEvalRequestPayload,
  AlignmentEvalResultPayload,
} from "../contracts/alignmentContracts";
import {
  EnvelopeBuildParams,
  buildEnvelope,
  EnvelopeSigner,
} from "../core/envelope";
import {
  AlignmentEvalRequestPayload as EngineRequestPayload,
  AlignmentEvalResultPayload as EngineResultPayload,
} from "../alignment/types";
import { evaluateAlignmentViaAdapter } from "../alignment/alignmentEngineAdapter";

/**
 * Alignment gateway interface.
 * Real implementation will live in the Alignment Engine repo.
 */
export interface AlignmentGateway {
  /**
   * Handle envelopes that invoke the Alignment Engine:
   * - alignment evaluation requests
   * - alignment summaries
   * - drift / contradiction signals
   */
  handle(envelope: MCPEnvelope): Promise<void>;
}

/**
 * No-op Alignment gateway for tests / wiring.
 */
export class NoopAlignmentGateway implements AlignmentGateway {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(_envelope: MCPEnvelope): Promise<void> {
    // Real logic in the Alignment repo (M-ALIGN-01).
  }
}

/**
 * Context needed for the demo Alignment gateway:
 * - signer: to build ALIGN.EVAL.RESULT envelopes
 * - emittingIdentity: node/module/agent that "owns" the Alignment Engine
 */
export interface DemoAlignmentContext {
  signer: EnvelopeSigner;
  emittingIdentity: MCPIdentityRef;
}

/**
 * Demo Alignment gateway:
 * - logs incoming ALIGN.EVAL.REQUEST payloads
 * - builds a dummy ALIGN.EVAL.RESULT envelope with fixed values
 *
 * This is a HYBRID stub:
 * - clearly fake scoring
 * - full request → result envelope flow
 */
export class DemoAlignmentGateway implements AlignmentGateway {
  constructor(private readonly ctx: DemoAlignmentContext) {}

  async handle(envelope: MCPEnvelope): Promise<void> {
    // Only handle ALIGN.EVAL.REQUEST in this demo.
    if (envelope.body.payloadType !== ALIGN_EVAL_REQUEST) {
      // eslint-disable-next-line no-console
      console.log(
        "[ALIGN DEMO] Ignoring non-eval payloadType:",
        envelope.body.payloadType
      );
      return;
    }

    const req = envelope.body
      .payload as AlignmentEvalRequestPayload;

    // Log the request in a human-readable way.
    // eslint-disable-next-line no-console
    console.log("[ALIGN DEMO] Eval request:", {
      subjectId: req.subjectId,
      snapshotScope: req.snapshotScope,
      contextRefs: req.contextRefs ?? [],
    });

    // Convert contract payload to engine-aligned format
    const engineRequest: EngineRequestPayload = {
      nodeId: req.subjectId,
      positionSnapshotId: req.snapshotScope,
      goalSnapshotId: req.contextRefs?.[0],
      valueSnapshotId: req.contextRefs?.[1],
      predictedSnapshotId: req.contextRefs?.[2],
      correlationId: envelope.header.envelopeId,
      requestedAt: envelope.header.timestamp,
    };

    // Call the adapter (single choke point for alignment evaluation)
    const engineResult: EngineResultPayload = await evaluateAlignmentViaAdapter(engineRequest);

    // Convert engine result back to contract format
    const result: AlignmentEvalResultPayload = {
      subjectId: engineResult.nodeId,
      snapshotScope: req.snapshotScope,
      score: engineResult.alignmentScore,
      flags: [], // flags derived from driftLevel if needed
      traceId: engineResult.evaluationId,
    };

    const now = new Date().toISOString();

    const params: EnvelopeBuildParams = {
      header: {
        timestamp: now,
        version: envelope.header.version,
        layer: "MCP-AGENT",
        type: "RESPONSE",
        source: this.ctx.emittingIdentity,
        target: envelope.header.source,
        capabilities: {
          declared: [],
        },
      },
      body: {
        payloadType: ALIGN_EVAL_RESULT,
        payload: result,
      },
      provenance: {
        route: [
          ...(envelope.provenance.route ?? []),
          {
            nodeId: this.ctx.emittingIdentity.nodeId,
            moduleId: this.ctx.emittingIdentity.moduleId,
            agentId: this.ctx.emittingIdentity.agentId,
            timestamp: now,
          },
        ],
        contextRefs: [
          ...(envelope.provenance.contextRefs ?? []),
          envelope.header.envelopeId,
        ],
      },
      safety: {
        snapshotScope: req.snapshotScope,
        alignmentFlags: result.flags,
        riskLevel: "LOW",
      },
    };

    const resultEnvelope = buildEnvelope(params, this.ctx.signer);

    // Log the result envelope for the demo.
    // eslint-disable-next-line no-console
    console.log("[ALIGN DEMO] Eval result envelope:", resultEnvelope);
  }
}
