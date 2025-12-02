import { MCPEnvelope } from "../core/envelope";
import { validateEnvelope } from "../core/validateEnvelope";
import { logEnvelope } from "../logging/envelopeLog";
import { handleAlignmentEnvelope } from "../adapters/alignmentAdapter";

export type MCPResponse = {
  ok: boolean;
  result?: any;
  error?: string;
};

export async function dispatch(envRaw: any): Promise<MCPResponse> {
  let env: MCPEnvelope;

  try {
    env = validateEnvelope(envRaw);
  } catch (err: any) {
    return { ok: false, error: `Validation error: ${err.message}` };
  }

  logEnvelope(env, { phase: "received" });

  try {
    let result: any;

    switch (env.target) {
      case "alignment-engine":
        result = await handleAlignmentEnvelope(env);
        break;
      default:
        throw new Error(`Unknown target module: ${env.target}`);
    }

    logEnvelope(env, { phase: "completed", status: "ok" });
    return { ok: true, result };
  } catch (err: any) {
    logEnvelope(env, { phase: "failed", status: "error", error: err.message });
    return { ok: false, error: err.message };
  }
}

