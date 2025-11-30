import { MCPEnvelope, MCPIdentityRef } from "../core/types";
import {
  AGENT_EXECUTE_PROCEDURE,
  AGENT_EVENT_STARTED,
  AGENT_EVENT_COMPLETED,
  AgentExecuteProcedurePayload,
  AgentProcedureStartedPayload,
  AgentProcedureCompletedPayload,
} from "../contracts/agentContracts";
import {
  EnvelopeBuildParams,
  buildEnvelope,
  EnvelopeSigner,
} from "../core/envelope";

/**
 * Agents gateway interface.
 * Real implementation will live in the Agents repo (M-AGENT-01).
 */
export interface AgentsGateway {
  /**
   * Handle envelopes for the Agents subsystem:
   * - procedure execution
   * - action events
   */
  handle(envelope: MCPEnvelope): Promise<void>;
}

/**
 * No-op Agents gateway for tests / wiring.
 */
export class NoopAgentsGateway implements AgentsGateway {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(_envelope: MCPEnvelope): Promise<void> {
    // Real logic in Agents repo.
  }
}

/**
 * Context needed for the demo Agents gateway:
 * - signer: to build event envelopes
 * - emittingIdentity: node/module/agent that "owns" the Agents subsystem
 */
export interface DemoAgentsContext {
  signer: EnvelopeSigner;
  emittingIdentity: MCPIdentityRef;
}

/**
 * Demo Agents gateway:
 * - handles AGENT.EXECUTE.PROCEDURE
 * - logs the command
 * - emits dummy STARTED and COMPLETED event envelopes and logs them
 *
 * This is a HYBRID stub:
 * - obviously fake execution
 * - full command → events envelope flow
 */
export class DemoAgentsGateway implements AgentsGateway {
  constructor(private readonly ctx: DemoAgentsContext) {}

  async handle(envelope: MCPEnvelope): Promise<void> {
    if (envelope.body.payloadType !== AGENT_EXECUTE_PROCEDURE) {
      // eslint-disable-next-line no-console
      console.log(
        "[AGENT DEMO] Ignoring non-execute payloadType:",
        envelope.body.payloadType
      );
      return;
    }

    const cmd = envelope.body
      .payload as AgentExecuteProcedurePayload;

    // Log the command in a human-readable way.
    // eslint-disable-next-line no-console
    console.log("[AGENT DEMO] Execute procedure command:", {
      procedureId: cmd.procedureId,
      runId: cmd.runId,
      snapshotScope: cmd.snapshotScope,
      parameters: cmd.parameters,
    });

    const now = new Date().toISOString();

    // Build STARTED event
    const startedPayload: AgentProcedureStartedPayload = {
      procedureId: cmd.procedureId,
      runId: cmd.runId,
      snapshotScope: cmd.snapshotScope,
      startedAt: now,
    };

    const startedParams: EnvelopeBuildParams = {
      header: {
        timestamp: now,
        version: envelope.header.version,
        layer: "MCP-AGENT",
        type: "EVENT",
        source: this.ctx.emittingIdentity,
        target: envelope.header.source,
        capabilities: { declared: [] },
      },
      body: {
        payloadType: AGENT_EVENT_STARTED,
        payload: startedPayload,
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
        snapshotScope: cmd.snapshotScope,
      },
    };

    const startedEnvelope = buildEnvelope(startedParams, this.ctx.signer);

    // Log STARTED event envelope
    // eslint-disable-next-line no-console
    console.log("[AGENT DEMO] Procedure STARTED event envelope:", startedEnvelope);

    // Build COMPLETED event (dummy)
    const completedAt = new Date().toISOString();

    const completedPayload: AgentProcedureCompletedPayload = {
      procedureId: cmd.procedureId,
      runId: cmd.runId,
      snapshotScope: cmd.snapshotScope,
      completedAt,
      resultSummary: "Demo execution completed successfully.",
    };

    const completedParams: EnvelopeBuildParams = {
      header: {
        timestamp: completedAt,
        version: envelope.header.version,
        layer: "MCP-AGENT",
        type: "EVENT",
        source: this.ctx.emittingIdentity,
        target: envelope.header.source,
        capabilities: { declared: [] },
      },
      body: {
        payloadType: AGENT_EVENT_COMPLETED,
        payload: completedPayload,
      },
      provenance: {
        route: [
          ...(startedEnvelope.provenance.route ?? []),
          {
            nodeId: this.ctx.emittingIdentity.nodeId,
            moduleId: this.ctx.emittingIdentity.moduleId,
            agentId: this.ctx.emittingIdentity.agentId,
            timestamp: completedAt,
          },
        ],
        contextRefs: [
          ...(startedEnvelope.provenance.contextRefs ?? []),
          startedEnvelope.header.envelopeId,
        ],
      },
      safety: {
        snapshotScope: cmd.snapshotScope,
      },
    };

    const completedEnvelope = buildEnvelope(
      completedParams,
      this.ctx.signer
    );

    // Log COMPLETED event envelope
    // eslint-disable-next-line no-console
    console.log(
      "[AGENT DEMO] Procedure COMPLETED event envelope:",
      completedEnvelope
    );
  }
}
