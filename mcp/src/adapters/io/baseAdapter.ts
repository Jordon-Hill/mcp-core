import { EnvelopeBuildParams } from "../../core/envelope";
import { MCPBody, MCPProvenance, MCPSafety } from "../../core/types";

export interface IOIngestContext {
  nodeId: string;
  targetModuleId: string;
  targetAgentId?: string;
  defaultSnapshotScope?: string;
}

export interface MCPIOAdapter<I = unknown> {
  readonly id: string;
  readonly description?: string;
  mapToEnvelopeParams(input: I, ctx: IOIngestContext): EnvelopeBuildParams;
}

export abstract class BaseMCPIOAdapter<I = unknown>
  implements MCPIOAdapter<I>
{
  abstract readonly id: string;
  readonly description?: string;

  constructor(description?: string) {
    this.description = description;
  }

  mapToEnvelopeParams(input: I, ctx: IOIngestContext): EnvelopeBuildParams {
    const header = this.buildHeader(input, ctx);
    const body = this.buildBody(input, ctx);
    const provenance = this.buildProvenance(input, ctx);
    const safety = this.buildSafety(input, ctx);
    return { header, body, provenance, safety };
  }

  protected abstract buildHeader(
    input: I,
    ctx: IOIngestContext
  ): EnvelopeBuildParams["header"];

  protected abstract buildBody(input: I, ctx: IOIngestContext): MCPBody;

  protected buildProvenance(
    _input: I,
    ctx: IOIngestContext
  ): Omit<MCPProvenance, "hash" | "signature"> {
    const now = new Date().toISOString();
    return {
      route: [
        {
          nodeId: ctx.nodeId,
          moduleId: ctx.targetModuleId,
          agentId: ctx.targetAgentId,
          timestamp: now,
        },
      ],
    };
  }

  protected buildSafety(_input: I, ctx: IOIngestContext): MCPSafety {
    return {
      snapshotScope: ctx.defaultSnapshotScope ?? "LIVE",
    };
  }
}

