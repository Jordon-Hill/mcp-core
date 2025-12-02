import { dispatch } from "./router";

test("MCP dispatch routes to alignment-engine", async () => {
  const envRaw = {
    origin: "test",
    target: "alignment-engine",
    timestamp: new Date().toISOString(),
    trace_id: "test-trace",
    intent: "query",
    side_effects: ["append:alignment-log"],
    schema_version: "1.0",
    payload: {
      position: { id: "pos1", facts: { x: 1 } },
      goals: { id: "goals1", goals: { profit: true } },
      values: { id: "values1", values: { sovereignty: true } },
    },
  };

  const res = await dispatch(envRaw);
  expect(res.ok).toBe(true);
  expect(res.result).toBeDefined();
});

