import crypto from "crypto";
import { MCPEnvelope } from "../core/types";
import { EnvelopeSigner } from "../core/envelope";
import { EnvelopeVerifier } from "../core/validation";

export interface NodeKeyPair {
  nodeId: string;
  publicKey: string;
  privateKey: string;
}

export class MCPKeyring {
  private nodes = new Map<string, NodeKeyPair>();

  generateNodeKeys(nodeId: string): NodeKeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });

    const entry: NodeKeyPair = {
      nodeId,
      publicKey: publicKey.export({ type: "pkcs1", format: "pem" }) as string,
      privateKey: privateKey.export({ type: "pkcs1", format: "pem" }) as string,
    };

    this.nodes.set(nodeId, entry);
    return entry;
  }

  registerNodeKeys(entry: NodeKeyPair): void {
    this.nodes.set(entry.nodeId, entry);
  }

  getNodeKeys(nodeId: string): NodeKeyPair | undefined {
    return this.nodes.get(nodeId);
  }
}

export class NodeSigner implements EnvelopeSigner {
  constructor(private keyring: MCPKeyring, private nodeId: string) {}

  sign(hash: string, _envelope: MCPEnvelope): string {
    const entry = this.keyring.getNodeKeys(this.nodeId);
    if (!entry) throw new Error(`No keys for node "${this.nodeId}"`);

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(hash);
    return signer.sign(entry.privateKey, "base64");
  }
}

export class NodeVerifier implements EnvelopeVerifier {
  constructor(private keyring: MCPKeyring) {}

  verify(hash: string, signature: string, envelope: MCPEnvelope): boolean {
    const nodeId = envelope.header.source.nodeId;
    const entry = this.keyring.getNodeKeys(nodeId);
    if (!entry) return false;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(hash);
    return verifier.verify(entry.publicKey, signature, "base64");
  }
}

