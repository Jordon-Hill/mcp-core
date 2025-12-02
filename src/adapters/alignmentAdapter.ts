import type { MCPEnvelope } from "../core/envelope";
import type {
  PositionState,
  GoalState,
  ValueState,
} from "../../../entity-alignment/alignment-engine/src/core/types";
import { evaluateAlignment } from "../../../entity-alignment/alignment-engine/src/evaluateAlignment";

export async function handleAlignmentEnvelope(env: MCPEnvelope): Promise<any> {
  const { payload } = env;
  const position: PositionState = payload.position;
  const goals: GoalState = payload.goals;
  const values: ValueState = payload.values;

  const result = evaluateAlignment(position, goals, values);

  return {
    result,
  };
}

