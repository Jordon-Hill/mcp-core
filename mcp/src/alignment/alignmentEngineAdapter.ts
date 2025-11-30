// src/alignment/alignmentEngineAdapter.ts

import {
  AlignmentEvalRequestPayload,
  AlignmentEvalResultPayload,
} from './types';

// ⬇️ Import the real core function from the Alignment Engine repo.
// Path: mcp core/mcp/src/alignment/ -> ../../../../ (to Dev/) -> entity-alignment/...
import { evaluateAlignment as engineEvaluateAlignment } from '../../../../entity-alignment/alignment-engine/src/core/index';

/**
 * v1 adapter:
 *  - uses the SAME request/result shapes as the Alignment Engine
 *  - delegates directly to the engine's evaluateAlignment() core
 *
 * NOTE:
 *  - We rely on structural typing: our AlignmentEvalRequestPayload matches
 *    the engine's request shape, so we can pass the object through.
 */
export async function evaluateAlignmentViaAdapter(
  request: AlignmentEvalRequestPayload,
): Promise<AlignmentEvalResultPayload> {
  // Direct call into Alignment Engine core.
  const result = engineEvaluateAlignment(request);

  // We trust the engine to return the correct AlignmentEvalResultPayload
  // shape. If needed later, we can add additional MCP-side decoration here.
  return result as AlignmentEvalResultPayload;
}
