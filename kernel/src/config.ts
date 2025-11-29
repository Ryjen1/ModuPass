/**
 * Configuration for ModuPass kernel workflow.
 */

export const KERNEL_CONFIG = {
  // Workflow version
  WORKFLOW_VERSION: "modupass-kernel-v1.0",

  // Receipt version
  RECEIPT_VERSION: "1.0.0",

  // Validation rules
  MAX_EVENT_ID_LENGTH: 100,
  MAX_CLAIM_DATA_SIZE: 10000, // bytes

  // Rate limiting (optional - implement in your backend)
  MAX_PASSES_PER_MINUTE: 10,
  MAX_PASSES_PER_HOUR: 100,

  // Timing constraints
  MAX_FUTURE_EVENT_DAYS: 365, // Max days in future an event can be
  MAX_PAST_EVENT_DAYS: 30, // Max days in past to allow claiming

  // Security
  REQUIRE_CHECKSUM_ADDRESS: false, // Set to true to enforce EIP-55 checksum
} as const;

/**
 * Get the current kernel configuration.
 * This can be extended to load from environment variables or a config file.
 */
export function getKernelConfig() {
  return {
    ...KERNEL_CONFIG,
    // Override with environment variables if needed
    WORKFLOW_VERSION:
      process.env.MODUPASS_WORKFLOW_VERSION || KERNEL_CONFIG.WORKFLOW_VERSION,
  };
}