import { MCPEnvelope } from "../core/types";

export interface TkdGateway {
  handle(envelope: MCPEnvelope): Promise<void>;
}

export class NoopTkdGateway implements TkdGateway {
  async handle(_envelope: MCPEnvelope): Promise<void> {}
}

