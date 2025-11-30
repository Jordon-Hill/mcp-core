import { MCPEnvelope, MCPRouteTarget } from "../core/types";

export type FedHandlerFn = (envelope: MCPEnvelope) => Promise<void> | void;

interface FedHandlerMap {
  [name: string]: FedHandlerFn;
}

export class FedDispatcher {
  private handlers: FedHandlerMap = {};

  registerHandler(name: string, fn: FedHandlerFn): void {
    this.handlers[name] = fn;
  }

  async dispatch(envelope: MCPEnvelope, target: MCPRouteTarget): Promise<void> {
    const handler = this.handlers[target.handler];
    if (!handler) {
      throw new Error(
        `FedDispatcher: no handler "${target.handler}" (payload="${envelope.body.payloadType}")`
      );
    }
    await handler(envelope);
  }
}

