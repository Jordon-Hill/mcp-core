/**
 * MCP v1.1 Federation
 * 
 * Implements: Federation section
 * MCP implements the federated handshake:
 * - node identity verification
 * - capability negotiation
 * - alignment and autonomy compatibility checks
 * - partial, voluntary synchronisation only
 * 
 * Remote override or coercive topologies are forbidden by design.
 */

import { MCPMessage, Intent, MessageContext, Identity } from "./message";

/**
 * Node capabilities
 */
export interface NodeCapabilities {
  nodeId: string;
  supportedIntents: Intent[];
  alignmentCompatible: boolean;
  autonomyLevel: "FULL" | "PARTIAL" | "NONE";
  syncCapabilities: SyncCapability[];
}

/**
 * Synchronization capability
 */
export interface SyncCapability {
  resource: string;
  syncType: "FULL" | "PARTIAL" | "VOLUNTARY";
  description?: string;
}

/**
 * Federation handshake request
 */
export interface FederationHandshakeRequest {
  requestingNode: Identity;
  requestingCapabilities: NodeCapabilities;
  targetNode: Identity;
}

/**
 * Federation handshake response
 */
export interface FederationHandshakeResponse {
  success: boolean;
  verified: boolean;
  compatible: boolean;
  negotiatedCapabilities?: NodeCapabilities;
  syncAgreement?: SyncAgreement;
  error?: string;
}

/**
 * Synchronization agreement between nodes
 */
export interface SyncAgreement {
  resources: string[];
  syncType: "FULL" | "PARTIAL" | "VOLUNTARY";
  voluntary: boolean;
}

/**
 * Performs node identity verification
 */
export function verifyNodeIdentity(
  nodeIdentity: Identity
): { verified: boolean; error?: string } {
  // Must have nodeId
  if (!nodeIdentity.nodeId || nodeIdentity.nodeId.trim().length === 0) {
    return {
      verified: false,
      error: "Node identity must include nodeId"
    };
  }

  // Cannot be "local" (reserved for current node)
  if (nodeIdentity.nodeId === "local") {
    return {
      verified: false,
      error: "Node identity 'local' is reserved"
    };
  }

  // In actual implementation, this would verify cryptographic signatures
  // For now, we just validate the structure
  return { verified: true };
}

/**
 * Negotiates capabilities between nodes
 */
export function negotiateCapabilities(
  requesting: NodeCapabilities,
  target: NodeCapabilities
): { compatible: boolean; negotiated?: NodeCapabilities; error?: string } {
  // Alignment compatibility check
  if (!requesting.alignmentCompatible || !target.alignmentCompatible) {
    return {
      compatible: false,
      error: "Alignment compatibility required for federation"
    };
  }

  // Autonomy compatibility check
  // Both nodes must respect each other's autonomy
  if (
    requesting.autonomyLevel === "NONE" ||
    target.autonomyLevel === "NONE"
  ) {
    return {
      compatible: false,
      error: "Both nodes must maintain autonomy for federation"
    };
  }

  // Find common intents
  const commonIntents = requesting.supportedIntents.filter((intent) =>
    target.supportedIntents.includes(intent)
  );

  if (commonIntents.length === 0) {
    return {
      compatible: false,
      error: "No common supported intents for federation"
    };
  }

  // Negotiate sync capabilities
  const negotiatedSync = negotiateSyncCapabilities(
    requesting.syncCapabilities,
    target.syncCapabilities
  );

  // Negotiate autonomy level (use minimum of both)
  const requestingLevel = autonomyLevelToNumber(requesting.autonomyLevel);
  const targetLevel = autonomyLevelToNumber(target.autonomyLevel);
  const negotiatedLevel = Math.min(requestingLevel, targetLevel);
  const autonomyLevel: "FULL" | "PARTIAL" | "NONE" =
    negotiatedLevel === 2
      ? "FULL"
      : negotiatedLevel === 1
      ? "PARTIAL"
      : "NONE";

  const negotiated: NodeCapabilities = {
    nodeId: requesting.nodeId,
    supportedIntents: commonIntents,
    alignmentCompatible: true,
    autonomyLevel,
    syncCapabilities: negotiatedSync
  };

  return {
    compatible: true,
    negotiated
  };
}

/**
 * Negotiates synchronization capabilities
 * Only partial, voluntary synchronization is allowed
 */
function negotiateSyncCapabilities(
  requesting: SyncCapability[],
  target: SyncCapability[]
): SyncCapability[] {
  const negotiated: SyncCapability[] = [];

  for (const reqCap of requesting) {
    const targetCap = target.find((cap) => cap.resource === reqCap.resource);
    if (targetCap) {
      // Both must agree on voluntary sync
      if (
        reqCap.syncType === "VOLUNTARY" &&
        targetCap.syncType === "VOLUNTARY"
      ) {
        negotiated.push({
          resource: reqCap.resource,
          syncType: "VOLUNTARY",
          description: `Voluntary sync for ${reqCap.resource}`
        });
      } else if (
        reqCap.syncType === "PARTIAL" &&
        targetCap.syncType === "PARTIAL"
      ) {
        negotiated.push({
          resource: reqCap.resource,
          syncType: "PARTIAL",
          description: `Partial sync for ${reqCap.resource}`
        });
      }
      // FULL sync is not allowed (coercive)
    }
  }

  return negotiated;
}

/**
 * Converts autonomy level to number for comparison
 */
function autonomyLevelToNumber(
  level: "FULL" | "PARTIAL" | "NONE"
): number {
  switch (level) {
    case "FULL":
      return 2;
    case "PARTIAL":
      return 1;
    case "NONE":
      return 0;
  }
}

/**
 * Performs federation handshake
 */
export async function performFederationHandshake(
  request: FederationHandshakeRequest
): Promise<FederationHandshakeResponse> {
  // Step 1: Verify requesting node identity
  const verifyRequesting = verifyNodeIdentity(request.requestingNode);
  if (!verifyRequesting.verified) {
    return {
      success: false,
      verified: false,
      compatible: false,
      error: `Requesting node identity verification failed: ${verifyRequesting.error}`
    };
  }

  // Step 2: Verify target node identity (in actual implementation, this would be done by target node)
  const verifyTarget = verifyNodeIdentity(request.targetNode);
  if (!verifyTarget.verified) {
    return {
      success: false,
      verified: false,
      compatible: false,
      error: `Target node identity verification failed: ${verifyTarget.error}`
    };
  }

  // Step 3: Negotiate capabilities
  // In actual implementation, target node capabilities would be fetched
  // For now, we assume target node has compatible capabilities
  const targetCapabilities: NodeCapabilities = {
    nodeId: request.targetNode.nodeId,
    supportedIntents: request.requestingCapabilities.supportedIntents, // Assume compatible
    alignmentCompatible: true,
    autonomyLevel: "FULL",
    syncCapabilities: []
  };

  const negotiation = negotiateCapabilities(
    request.requestingCapabilities,
    targetCapabilities
  );

  if (!negotiation.compatible) {
    return {
      success: false,
      verified: true,
      compatible: false,
      error: negotiation.error
    };
  }

  // Step 4: Create sync agreement (voluntary only)
  const syncAgreement: SyncAgreement = {
    resources: negotiation.negotiated?.syncCapabilities.map((cap) => cap.resource) || [],
    syncType: "VOLUNTARY",
    voluntary: true
  };

  return {
    success: true,
    verified: true,
    compatible: true,
    negotiatedCapabilities: negotiation.negotiated,
    syncAgreement
  };
}

/**
 * Creates a federation handshake message
 */
export function createFederationHandshakeMessage(
  context: MessageContext,
  handshakeRequest: FederationHandshakeRequest,
  schema: string,
  schemaVersion: string
): MCPMessage {
  return {
    context,
    intent: "FEDERATION_HANDSHAKE",
    payload: {
      schema,
      schemaVersion,
      content: handshakeRequest
    }
  };
}
