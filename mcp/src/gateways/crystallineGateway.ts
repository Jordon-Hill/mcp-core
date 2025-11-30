import { MCPEnvelope, MCPIdentityRef } from "../core/types";
import {
  CRYS_SNAPSHOT_REQUEST,
  CRYS_SNAPSHOT_RESPONSE,
  CrystallineSnapshotRequestPayload,
  CrystallineSnapshotResponsePayload,
} from "../contracts/crystallineContracts";
import {
  EnvelopeBuildParams,
  buildEnvelope,
  EnvelopeSigner,
} from "../core/envelope";

/**
 * Crystalline gateway interface.
 * Real logic lives in Crystalline repo.
 */
export interface CrystallineGateway {
  handle(envelope: MCPEnvelope): Promise<void>;
}

/**
 * No-op for wiring tests.
 */
export class NoopCrystallineGateway implements CrystallineGateway {
  async handle(_envelope: MCPEnvelope): Promise<void> {}
}

/**
 * Demo Crystalline gateway:
 * - Handles CRYS_SNAPSHOT_REQUEST
 * - Logs request
 * - Returns a dummy CRYS_SNAPSHOT_RESPONSE envelope with a fake KG reference
 */
export class DemoCrystallineGateway implements CrystallineGateway {
  constructor(
    private readonly signer: EnvelopeSigner,
    private readonly emittingIdentity: MCPIdentityRef
  ) {}

  async handle(envelope: MCPEnvelope): Promise<void> {
    if (envelope.body.payloadType !== CRYS_SNAPSHOT_REQUEST) {
      // eslint-disable-next-line no-console
      console.log(
        "[CRYS DEMO] Ignoring non-snapshot-request:",
        envelope.body.payloadType
      );
      return;
    }

    const req = envelope.body
      .payload as CrystallineSnapshotRequestPayload;

    // Log the incoming request
    // eslint-disable-next-line no-console
    console.log("[CRYS DEMO] Snapshot request:", req);

    // Build dummy response
    const now = new Date().toISOString();

    const responsePayload: CrystallineSnapshotResponsePayload = {
      snapshotId: req.snapshotId,
      createdAt: now,
      meta: req.includeMeta
        ? {
            kgNodes: 1234,
            kgEdges: 5678,
            note: "Demo metadata only",
          }
        : undefined,
      kgRef: `local://crystalline/snapshots/${req.snapshotId}.json`,
    };

    const params: EnvelopeBuildParams = {
      header: {
        timestamp: now,
        version: envelope.header.version,
        layer: "MCP-AGENT",
        type: "RESPONSE",
        source: this.emittingIdentity,
        target: envelope.header.source,
        capabilities: { declared: [] },
      },
      body: {
        payloadType: CRYS_SNAPSHOT_RESPONSE,
        payload: responsePayload,
      },
      provenance: {
        route: [
          ...(envelope.provenance.route ?? []),
          {
            nodeId: this.emittingIdentity.nodeId,
            moduleId: this.emittingIdentity.moduleId,
            agentId: this.emittingIdentity.agentId,
            timestamp: now,
          },
        ],
        contextRefs: [
          ...(envelope.provenance.contextRefs ?? []),
          envelope.header.envelopeId,
        ],
      },
      safety: {
        snapshotScope: req.snapshotId,
      },
    };

    const responseEnvelope = buildEnvelope(
      params,
      this.signer
    );

    // eslint-disable-next-line no-console
    console.log("[CRYS DEMO] Snapshot response envelope:", responseEnvelope);
  }
}
