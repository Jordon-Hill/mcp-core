import {
  MCPEnvelope,
  MCPErrorClass,
  MCPErrorBody,
  MCPErrorCode,
  MCPErrorSeverity,
  MCPErrorRetryInfo,
  MCPErrorContext,
  MCPIdentityRef,
  MCPBody,
  MCPSafety,
  MCPProvenance

} from "./types";
import {
  EnvelopeBuildParams,
  buildEnvelope,
  EnvelopeSigner,
  EnvelopeBuilderOptions

} from "./envelope";

// ========================================================
// Error Code Mappings (MCP v1.1)
// ========================================================
const ERROR_CODE_MAP: Record<MCPErrorClass, MCPErrorCode[]> = {
  "ERROR.TRANSPORT": [
    "TRANSPORT_1001",
    "TRANSPORT_1002",
    "TRANSPORT_1003",
    "TRANSPORT_1004",
    "TRANSPORT_1005",
  ],
  "ERROR.VALIDATION": [
    "VALIDATION_2001",
    "VALIDATION_2002",
    "VALIDATION_2003",
    "VALIDATION_2004",
    "VALIDATION_2005",
  ],
  "ERROR.AUTH": [
    "AUTH_3001",
    "AUTH_3002",
    "AUTH_3003",
    "AUTH_3004",
    "AUTH_3005",
  ],
  "ERROR.SAFETY": [
    "SAFETY_4001",
    "SAFETY_4002",
    "SAFETY_4003",
    "SAFETY_4004",
    "SAFETY_4005",
  ],
  "ERROR.ROUTING": [
    "ROUTING_5001",
    "ROUTING_5002",
    "ROUTING_5003",
    "ROUTING_5004",
  ],
  "ERROR.ALIGNMENT": [
    "ALIGNMENT_6001",
    "ALIGNMENT_6002",
    "ALIGNMENT_6003",
    "ALIGNMENT_6004",
  ],
  "ERROR.CONSTITUTIONAL": [
    "CONSTITUTIONAL_7001",
    "CONSTITUTIONAL_7002",
    "CONSTITUTIONAL_7003",
    "CONSTITUTIONAL_7004",
  ],
  "ERROR.INTERNAL": [
    "INTERNAL_8001",
    "INTERNAL_8002",
    "INTERNAL_8003",
    "INTERNAL_8004",
    "INTERNAL_8005",
  ],
};

const DEFAULT_ERROR_CODES: Record<MCPErrorClass, MCPErrorCode> = {
  "ERROR.TRANSPORT": "TRANSPORT_1001",
  "ERROR.VALIDATION": "VALIDATION_2001",
  "ERROR.AUTH": "AUTH_3001",
  "ERROR.SAFETY": "SAFETY_4001",
  "ERROR.ROUTING": "ROUTING_5001",
  "ERROR.ALIGNMENT": "ALIGNMENT_6001",
  "ERROR.CONSTITUTIONAL": "CONSTITUTIONAL_7001",
  "ERROR.INTERNAL": "INTERNAL_8001",
};

const DEFAULT_SEVERITY_MAP: Record<MCPErrorClass, MCPErrorSeverity> = {
  "ERROR.TRANSPORT": "MEDIUM",
  "ERROR.VALIDATION": "LOW",
  "ERROR.AUTH": "HIGH",
  "ERROR.SAFETY": "CRITICAL",
  "ERROR.ROUTING": "MEDIUM",
  "ERROR.ALIGNMENT": "HIGH",
  "ERROR.CONSTITUTIONAL": "CRITICAL",
  "ERROR.INTERNAL": "HIGH",
};

const DEFAULT_RETRY_INFO: Record<MCPErrorClass, MCPErrorRetryInfo> = {
  "ERROR.TRANSPORT": { retryable: true, retryAfter: 5, maxRetries: 3, backoffStrategy: "exponential" },
  "ERROR.VALIDATION": { retryable: false },
  "ERROR.AUTH": { retryable: false },
  "ERROR.SAFETY": { retryable: false },
  "ERROR.ROUTING": { retryable: true, retryAfter: 2, maxRetries: 2, backoffStrategy: "fixed" },
  "ERROR.ALIGNMENT": { retryable: false },
  "ERROR.CONSTITUTIONAL": { retryable: false },
  "ERROR.INTERNAL": { retryable: true, retryAfter: 10, maxRetries: 1, backoffStrategy: "fixed" },
};

// ========================================================
// Error Creation Functions (MCP v1.1)
// ========================================================

export interface CreateErrorBodyOptions {
  errorCode?: MCPErrorCode;
  severity?: MCPErrorSeverity;
  retry?: MCPErrorRetryInfo;
  context?: MCPErrorContext;
  cause?: {
    errorCode: MCPErrorCode;
    message: string;
  };
  timestamp?: string;
}

export function createErrorBody(
  errorClass: MCPErrorClass,
  message: string,
  correlationId: string,
  details?: unknown,
  options: CreateErrorBodyOptions = {}
): MCPErrorBody {
  const errorCode = options.errorCode ?? DEFAULT_ERROR_CODES[errorClass];
  const severity = options.severity ?? DEFAULT_SEVERITY_MAP[errorClass];
  const retry = options.retry ?? DEFAULT_RETRY_INFO[errorClass];
  const timestamp = options.timestamp ?? new Date().toISOString();

  // Validate error code matches error class
  const validCodes = ERROR_CODE_MAP[errorClass];
  if (!validCodes.includes(errorCode)) {
    throw new Error(
      `Error code ${errorCode} does not match error class ${errorClass}. Valid codes: ${validCodes.join(", ")}`
    );
  }

  return {
    errorClass,
    errorCode,
    message,
    correlationId,
    severity,
    timestamp,
    details,
    context: options.context,
    retry,
    cause: options.cause,
  };
}

export interface BuildErrorEnvelopeParamsOptions extends CreateErrorBodyOptions {
  // Additional options for envelope building
}

export function buildErrorEnvelopeParams(
  original: MCPEnvelope,
  emitting: MCPIdentityRef,
  errorClass: MCPErrorClass,
  message: string,
  details?: unknown,
  errorOptions: BuildErrorEnvelopeParamsOptions = {}
): EnvelopeBuildParams {
  const correlationId = original.header.envelopeId;
  const now = new Date().toISOString();

  // Build error context from emitting identity if not provided
  const context: MCPErrorContext = errorOptions.context ?? {
    moduleId: emitting.moduleId,
    agentId: emitting.agentId,
  };

  // Create error body with v1.1 enhancements
  const errorBody = createErrorBody(
    errorClass,
    message,
    correlationId,
    details,
    {
      ...errorOptions,
      context,
      timestamp: now,
    }
  );

  const header: EnvelopeBuildParams["header"] = {
    timestamp: now,
    version: original.header.version,
    layer: original.header.layer,
    type: "RESPONSE",
    priority: original.header.priority ?? "NORMAL",
    source: emitting,
    target: original.header.source,
    capabilities: { declared: [] },
  };

  const body: MCPBody = {
    payloadType: "MCP.ERROR",
    payload: errorBody,
  };

  const provenance: Omit<MCPProvenance, "hash" | "signature"> = {
    route: [
      ...(original.provenance.route ?? []),
      {
        nodeId: emitting.nodeId,
        moduleId: emitting.moduleId,
        agentId: emitting.agentId,
        timestamp: now,
      },
    ],
    contextRefs: [
      ...(original.provenance.contextRefs ?? []),
      original.header.envelopeId,
    ],
  };

  // Adjust safety risk level based on error severity
  const errorSeverity = errorBody.severity;
  const riskLevelMap: Record<MCPErrorSeverity, MCPSafety["riskLevel"]> = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL",
  };
  const riskLevel = riskLevelMap[errorSeverity] ?? original.safety.riskLevel ?? "LOW";

  const safety: MCPSafety = {
    snapshotScope: original.safety.snapshotScope,
    alignmentFlags: original.safety.alignmentFlags,
    riskLevel,
  };

  return { header, body, provenance, safety };
}

export function buildErrorEnvelope(
  original: MCPEnvelope,
  emitting: MCPIdentityRef,
  signer: EnvelopeSigner,
  errorClass: MCPErrorClass,
  message: string,
  details?: unknown,
  errorOptions: BuildErrorEnvelopeParamsOptions = {},
  envelopeOptions: EnvelopeBuilderOptions = {}
): MCPEnvelope {
  const params = buildErrorEnvelopeParams(
    original,
    emitting,
    errorClass,
    message,
    details,
    errorOptions
  );
  return buildEnvelope(params, signer, envelopeOptions);
}

// ========================================================
// Convenience Functions for Common Error Types
// ========================================================

export function createTransportError(
  message: string,
  correlationId: string,
  errorCode: MCPErrorCode = "TRANSPORT_1001",
  details?: unknown
): MCPErrorBody {
  return createErrorBody("ERROR.TRANSPORT", message, correlationId, details, {
    errorCode,
  });
}

export function createValidationError(
  message: string,
  correlationId: string,
  errorCode: MCPErrorCode = "VALIDATION_2001",
  details?: unknown
): MCPErrorBody {
  return createErrorBody("ERROR.VALIDATION", message, correlationId, details, {
    errorCode,
  });
}

export function createAuthError(
  message: string,
  correlationId: string,
  errorCode: MCPErrorCode = "AUTH_3001",
  details?: unknown
): MCPErrorBody {
  return createErrorBody("ERROR.AUTH", message, correlationId, details, {
    errorCode,
  });
}

export function createSafetyError(
  message: string,
  correlationId: string,
  errorCode: MCPErrorCode = "SAFETY_4001",
  details?: unknown
): MCPErrorBody {
  return createErrorBody("ERROR.SAFETY", message, correlationId, details, {
    errorCode,
    severity: "CRITICAL",
  });
}

export function createRoutingError(
  message: string,
  correlationId: string,
  errorCode: MCPErrorCode = "ROUTING_5001",
  details?: unknown
): MCPErrorBody {
  return createErrorBody("ERROR.ROUTING", message, correlationId, details, {
    errorCode,
  });
}

export function createAlignmentError(
  message: string,
  correlationId: string,
  errorCode: MCPErrorCode = "ALIGNMENT_6001",
  details?: unknown
): MCPErrorBody {
  return createErrorBody("ERROR.ALIGNMENT", message, correlationId, details, {
    errorCode,
    severity: "HIGH",
  });
}

export function createConstitutionalError(
  message: string,
  correlationId: string,
  errorCode: MCPErrorCode = "CONSTITUTIONAL_7001",
  details?: unknown
): MCPErrorBody {
  return createErrorBody("ERROR.CONSTITUTIONAL", message, correlationId, details, {
    errorCode,
    severity: "CRITICAL",
  });
}

export function createInternalError(
  message: string,
  correlationId: string,
  errorCode: MCPErrorCode = "INTERNAL_8001",
  details?: unknown,
  cause?: { errorCode: MCPErrorCode; message: string }
): MCPErrorBody {
  return createErrorBody("ERROR.INTERNAL", message, correlationId, details, {
    errorCode,
    cause,
  });
}

