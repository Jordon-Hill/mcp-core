export interface MCPNodeIdentity {
  nodeId: string;
  displayName?: string;
}

export interface MCPModuleIdentity {
  moduleId: string;
  displayName?: string;
}

export interface MCPAgentIdentity {
  agentId: string;
  displayName?: string;
}

export interface MCPIdentityTriple {
  node: MCPNodeIdentity;
  module?: MCPModuleIdentity;
  agent?: MCPAgentIdentity;
}

export function describeIdentity(triple: MCPIdentityTriple): string {
  return [
    triple.node.nodeId,
    triple.module?.moduleId,
    triple.agent?.agentId,
  ]
    .filter(Boolean)
    .join("::");
}

