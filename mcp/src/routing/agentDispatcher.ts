import { MCPEnvelope, MCPRouteTarget } from "../core/types";

export type AgentHandlerFn = (envelope: MCPEnvelope) => Promise<void> | void;

interface AgentHandlerMap {
  [name: string]: AgentHandlerFn;
}

export class AgentDispatcher {
  private handlers: AgentHandlerMap = {};

  registerHandler(name: string, fn: AgentHandlerFn): void {
    this.handlers[name] = fn;
  }

  async dispatch(envelope: MCPEnvelope, target: MCPRouteTarget): Promise<void> {
    const handler = this.handlers[target.handler];
    if (!handler) {
      throw new Error(
        `AgentDispatcher: no handler "${target.handler}" (payload="${envelope.body.payloadType}")`
      );
    }
    await handler(envelope);
  }
}

