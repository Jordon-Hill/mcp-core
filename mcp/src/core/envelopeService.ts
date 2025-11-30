// src/core/envelopeService.ts

import { MCPEnvelope, MCPIdentityRef } from "./types";
import { buildEnvelope, EnvelopeBuildParams, EnvelopeSigner } from "./envelope";
import { MCPKeyring, NodeSigner } from "../identity/keyring";
import { InMemoryLdsIngestQueue } from "../gateways/ldsIngestQueue";
import { QueueLdsGateway } from "../gateways/ldsGateway";

// Singleton instances for demo use
let defaultKeyring: MCPKeyring | null = null;
let defaultSigner: EnvelopeSigner | null = null;
let defaultLdsQueue: InMemoryLdsIngestQueue | null = null;
let defaultLdsGateway: QueueLdsGateway | null = null;

function getDefaultKeyring(): MCPKeyring {
  if (!defaultKeyring) {
    defaultKeyring = new MCPKeyring();
    defaultKeyring.generateNodeKeys("node-1");
  }
  return defaultKeyring;
}

function getDefaultSigner(): EnvelopeSigner {
  if (!defaultSigner) {
    const keyring = getDefaultKeyring();
    defaultSigner = new NodeSigner(keyring, "node-1");
  }
  return defaultSigner;
}

export function getDefaultLdsQueue(): InMemoryLdsIngestQueue {
  if (!defaultLdsQueue) {
    defaultLdsQueue = new InMemoryLdsIngestQueue();
  }
  return defaultLdsQueue;
}

function getDefaultLdsGateway(): QueueLdsGateway {
  if (!defaultLdsGateway) {
    const queue = getDefaultLdsQueue();
    defaultLdsGateway = new QueueLdsGateway(queue);
  }
  return defaultLdsGateway;
}

export interface CreateEnvelopeOptions {
  type: string;
  payload: unknown;
  source?: MCPIdentityRef;
  target?: MCPIdentityRef;
}

/**
 * Create an MCP envelope with standard structure.
 * Uses default node-1 identity and signer for demos.
 */
export function createEnvelope(options: CreateEnvelopeOptions): MCPEnvelope {
  const signer = getDefaultSigner();
  const now = new Date().toISOString();

  const source: MCPIdentityRef = options.source || {
    nodeId: "node-1",
    moduleId: "ALIGNMENT",
    agentId: "ALIGN.DEMO",
  };

  const target: MCPIdentityRef = options.target || {
    nodeId: "node-1",
    moduleId: "LDS",
  };

  const params: EnvelopeBuildParams = {
    header: {
      timestamp: now,
      version: "1.0.0",
      layer: "MCP-AGENT",
      type: "EVENT",
      source,
      target,
      capabilities: { declared: [] },
    },
    body: {
      payloadType: options.type,
      payload: options.payload,
    },
    provenance: {
      route: [
        {
          nodeId: source.nodeId,
          moduleId: source.moduleId,
          agentId: source.agentId,
          timestamp: now,
        },
      ],
    },
    safety: {
      snapshotScope: "LIVE",
    },
  };

  return buildEnvelope(params, signer);
}

/**
 * Enqueue an envelope into the LDS ingest queue.
 */
export async function enqueueEnvelope(envelope: MCPEnvelope): Promise<void> {
  const gateway = getDefaultLdsGateway();
  await gateway.handle(envelope);
}

