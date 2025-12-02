import fs from "fs";
import path from "path";
import { MCPEnvelope } from "../core/envelope";

const LOG_PATH = path.join(process.cwd(), "logs", "mcp-envelope-log.jsonl");

export function logEnvelope(env: MCPEnvelope, extra: Record<string, any> = {}) {
  const entry = {
    ...env,
    ...extra,
    log_timestamp: new Date().toISOString(),
  };

  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n");
}

