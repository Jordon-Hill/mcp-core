// src/core/envelopeTypes.ts

/**
 * Registry of envelope payload types.
 * Used for type checking and routing.
 */
export const envelopeTypes = {
  alignment: {
    evaluationV0: 'alignment.evaluation.v0',
  },
  // Add other types as needed
} as const;

