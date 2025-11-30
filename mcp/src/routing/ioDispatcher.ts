import { MCPEnvelope, MCPRouteTarget } from "../core/types";

export type IOHandlerFn = (envelope: MCPEnvelope) => Promise<void> | void;

interface IOHandlerMap {
  [name: string]: IOHandlerFn;
}

export class IODispatcher {
  private handlers: IOHandlerMap = {};

  registerHandler(name: string, fn: IOHandlerFn): void {
    this.handlers[name] = fn;
  }

  async dispatch(envelope: MCPEnvelope, target: MCPRouteTarget): Promise<void> {
    const handler = this.handlers[target.handler];
    if (!handler) {
      throw new Error(
        `IODispatcher: no handler for "${target.handler}" (payload="${envelope.body.payloadType}")`
      );
    }
    await handler(envelope);
  }
}

