import { MCPEnvelope, MCPIdentityRef } from "../core/types";
import {
  FED_SNAPSHOT_OFFER,
  FED_ALIGNMENT_SUMMARY,
  FederatedSnapshotOfferPayload,
  FederatedAlignmentSummaryPayload,
} from "../contracts/federationContracts";
import {
  EnvelopeBuildParams,
  buildEnvelope,
  EnvelopeSigner,
} from "../core/envelope";

/**
 * Federation gateway interface.
 * Real implementation will live in Federated Network repo (M-FED-01).
 */
export interface FederationGateway {
  /**
   * Handle envelopes for federated operations:
   * - pattern offers
   * - snapshot offers
   * - rule deltas
   * - alignment summaries between nodes
   */
  handle(envelope: MCPEnvelope): Promise<void>;
}

/**
 * No-op Federation gateway for tests / wiring.
 */
export class NoopFederationGateway implements FederationGateway {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(_envelope: MCPEnvelope): Promise<void> {
    // Real logic in Federated Network repo (M-FED-01).
  }
}

/**
 * Context for the demo Federation gateway.
 */
export interface DemoFederationContext {
  signer: EnvelopeSigner;
  emittingIdentity: MCPIdentityRef; // the receiving node's identity
}

/**
 * Demo Federation gateway:
 * - handles FED.SNAPSHOT.OFFER
 * - logs the offer
 * - builds a dummy FED.ALIGNMENT.SUMMARY envelope and logs it
 *
 * This is a HYBRID stub:
 * - no real network, no real rules
 * - shows the pattern of offer → meta-response
 */
export class DemoFederationGateway implements FederationGateway {
  constructor(private readonly ctx: DemoFederationContext) {}

  async handle(envelope: MCPEnvelope): Promise<void> {
    if (envelope.body.payloadType !== FED_SNAPSHOT_OFFER) {
      // eslint-disable-next-line no-console
      console.log(
        "[FED DEMO] Ignoring non-snapshot-offer payloadType:",
        envelope.body.payloadType
      );
      return;
    }

    const offer = envelope.body
      .payload as FederatedSnapshotOfferPayload;

    // Log incoming offer in a human-readable way
    // eslint-disable-next-line no-console
    console.log("[FED DEMO] Snapshot offer received:", offer);

    const now = new Date().toISOString();

    const summaryPayload: FederatedAlignmentSummaryPayload = {
      fromNodeId: this.ctx.emittingIdentity.nodeId,
      toNodeId: offer.fromNodeId,
      timeRangeStart: now,
      timeRangeEnd: now,
      driftEvents: 0,
      contradictionEvents: 0,
      notes: "Demo alignment summary: no issues.",
    };

    const params: EnvelopeBuildParams = {
      header: {
        timestamp: now,
        version: envelope.header.version,
        layer: "MCP-FED",
        type: "EVENT",
        source: this.ctx.emittingIdentity,
        target: {
          nodeId: offer.fromNodeId,
          moduleId: envelope.header.source.moduleId,
          agentId: envelope.header.source.agentId,
        },
        capabilities: { declared: [] },
      },
      body: {
        payloadType: FED_ALIGNMENT_SUMMARY,
        payload: summaryPayload,
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
        snapshotScope: offer.snapshotId,
      },
    };

    const summaryEnvelope = buildEnvelope(params, this.ctx.signer);

    // eslint-disable-next-line no-console
    console.log(
      "[FED DEMO] Alignment summary envelope (not routed further in demo):",
      summaryEnvelope
    );
  }
}
