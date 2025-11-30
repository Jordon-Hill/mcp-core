import { BaseMCPIOAdapter, IOIngestContext } from "./baseAdapter";
import { EnvelopeBuildParams } from "../../core/envelope";

export interface FileIngestInput {
  path: string;
  content: string;
}

export class FileIngestAdapter extends BaseMCPIOAdapter<FileIngestInput> {
  readonly id = "io.file.ingest";

  protected buildHeader(
    _input: FileIngestInput,
    ctx: IOIngestContext
  ): EnvelopeBuildParams["header"] {
    return {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      layer: "MCP-IO",
      type: "EVENT",
      source: { nodeId: ctx.nodeId },
      target: { nodeId: ctx.nodeId, moduleId: ctx.targetModuleId },
      capabilities: { declared: [] },
    };
  }

  protected buildBody(input: FileIngestInput) {
    return {
      payloadType: "LDS.INGEST.FILE",
      payload: {
        path: input.path,
        content: input.content,
      },
    };
  }
}

