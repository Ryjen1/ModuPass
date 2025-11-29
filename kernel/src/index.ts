// Entry point for ModuPass KRNL workflow logic.
// This module is intentionally framework-agnostic so it can be used from
// a CLI, a backend service, or a KRNL Studio configuration.

import { createHash } from "crypto";
import type { EventConfig, ClaimData } from "./types";
import { isEventActive, verifySecretCode, checkAllowlist } from "./validators";
import { getKernelConfig } from "./config";

// Re-export types for consumers
export type { EventConfig, ClaimData, WorkflowReceipt } from "./types";
export { isValidEthereumAddress, isValidEventId } from "./validators";

// Re-export KRNL client
export { KRNLClient, createKRNLClient } from "./krnl-client";
export type { KRNLWorkflowInput, KRNLAuthData, KRNLWorkflowResult, KRNLClientConfig } from "./krnl-client";

// Re-export workflow client
export {
  executeAttendanceWorkflow,
  generateAttendanceProof,
  proofToBytes,
  validateEventData,
  validateCreateEventData,
} from "./workflow-client";
export type {
  KRNLWorkflowInput as WorkflowInput,
  KRNLWorkflowResult as WorkflowResult,
  AttendanceProofData,
  CreateEventData,
} from "./workflow-client";

export interface IssuePassInput {
  /**
   * Human-readable event identifier, chosen by the organizer.
   * Example: "ethcc-2025-day1" or "modupass-demo-001".
   */
  eventId: string;

  /** Wallet address of the attendee claiming a pass. */
  attendeeAddress: string;

  /**
   * Arbitrary claim data collected from the frontend or external systems.
   * This might include a secret event code, proof-of-attendance payload,
   * signatures, or references to off-chain records.
   */
  claimData?: Record<string, unknown>;
}

export interface IssuePassResult {
  /** Identifier of the KRNL workflow / kernel used for this issuance. */
  workflowId: string;

  /** Hash of the verifiable KRNL receipt anchoring off-chain execution. */
  receiptHash: string;

  /** Optional metadata useful for UIs and debugging. */
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the input data for issuing a pass.
 */
export function validateIssuePassInput(
  input: IssuePassInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate eventId
  if (!input.eventId || typeof input.eventId !== "string") {
    errors.push("eventId is required and must be a string");
  } else if (input.eventId.trim().length === 0) {
    errors.push("eventId cannot be empty");
  } else if (input.eventId.length > 100) {
    errors.push("eventId must be less than 100 characters");
  } else if (!/^[a-zA-Z0-9-_]+$/.test(input.eventId)) {
    warnings.push(
      "eventId contains special characters - consider using only alphanumeric, hyphens, and underscores"
    );
  }

  // Validate attendeeAddress
  if (!input.attendeeAddress || typeof input.attendeeAddress !== "string") {
    errors.push("attendeeAddress is required and must be a string");
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(input.attendeeAddress)) {
    errors.push("attendeeAddress must be a valid Ethereum address (0x + 40 hex chars)");
  }

  // Validate claimData if provided
  if (input.claimData !== undefined && input.claimData !== null) {
    if (typeof input.claimData !== "object" || Array.isArray(input.claimData)) {
      errors.push("claimData must be an object if provided");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generates a deterministic receipt hash for the workflow execution.
 * This hash can be used to verify the integrity of the workflow execution.
 */
export function generateReceiptHash(input: IssuePassInput): string {
  // Create a deterministic receipt object
  const receipt = {
    version: "1.0.0",
    eventId: input.eventId,
    attendeeAddress: input.attendeeAddress.toLowerCase(), // Normalize address
    claimData: input.claimData || {},
    timestamp: Date.now(),
    workflowVersion: "modupass-kernel-v1.0",
  };

  // Generate SHA-256 hash of the receipt
  const hash = createHash("sha256")
    .update(JSON.stringify(receipt))
    .digest("hex");

  return "0x" + hash;
}

/**
 * Encodes the workflow ID as bytes32 for on-chain storage.
 */
export function encodeWorkflowId(workflowId: string): string {
  // For simplicity, we'll use a hash of the workflow ID
  // In production, you might want to use a more sophisticated encoding
  const hash = createHash("sha256").update(workflowId).digest("hex");
  return "0x" + hash;
}

/**
 * Main high-level workflow used by ModuPass.
 *
 * This function:
 * 1. Validates the input and claim data.
 * 2. Runs eligibility checks (can be extended with external API calls).
 * 3. Generates a verifiable receipt hash.
 * 4. Returns workflow metadata for on-chain anchoring.
 * 
 * @param input - The input data for issuing a pass
 * @param eventConfig - Optional event configuration for additional validation
 */
export async function issuePassWorkflow(
  input: IssuePassInput,
  eventConfig?: EventConfig
): Promise<IssuePassResult> {
  const config = getKernelConfig();
  const startTime = Date.now();

  // Step 1: Validate input
  const validation = validateIssuePassInput(input);

  if (!validation.isValid) {
    throw new Error(
      `Validation failed: ${validation.errors.join(", ")}`
    );
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn("Validation warnings:", validation.warnings);
  }

  // Step 2: Run eligibility checks
  await runEligibilityChecks(input, eventConfig);

  // Step 3: Generate receipt hash
  const receiptHash = generateReceiptHash(input);

  // Step 4: Prepare workflow metadata
  const workflowId = config.WORKFLOW_VERSION;
  const endTime = Date.now();

  const metadata = {
    processedAt: new Date().toISOString(),
    eventId: input.eventId,
    attendeeAddress: input.attendeeAddress,
    workflowVersion: workflowId,
    validationWarnings: validation.warnings,
    claimDataProvided: !!input.claimData,
    processingTimeMs: endTime - startTime,
    eventConfigProvided: !!eventConfig,
  };

  return {
    workflowId,
    receiptHash,
    metadata,
  };
}

/**
 * Runs eligibility checks for pass issuance.
 * This is where you can add custom business logic.
 * 
 * @param input - The input data for issuing a pass
 * @param eventConfig - Optional event configuration (fetch from on-chain or database)
 */
async function runEligibilityChecks(
  input: IssuePassInput,
  eventConfig?: EventConfig
): Promise<void> {
  const checks = [];

  // If event config is provided, run event-specific checks
  if (eventConfig) {
    // Check if event is active (timing)
    const timingCheck = isEventActive(eventConfig);
    checks.push(timingCheck);
    if (!timingCheck.passed) {
      throw new Error(timingCheck.reason || "Event timing check failed");
    }

    // Check secret code if required
    const secretCodeCheck = verifySecretCode(eventConfig, input.claimData as ClaimData);
    checks.push(secretCodeCheck);
    if (!secretCodeCheck.passed) {
      throw new Error(secretCodeCheck.reason || "Secret code verification failed");
    }

    // Check allowlist if exists
    const allowlistCheck = checkAllowlist(eventConfig, input.attendeeAddress);
    checks.push(allowlistCheck);
    if (!allowlistCheck.passed) {
      throw new Error(allowlistCheck.reason || "Allowlist check failed");
    }

    // Check max passes limit if set
    if (eventConfig.maxPasses !== undefined) {
      // TODO: Query on-chain contract to get current pass count
      // const currentPasses = await getPassCount(eventConfig.id);
      // if (currentPasses >= eventConfig.maxPasses) {
      //   throw new Error("Maximum number of passes reached for this event");
      // }
    }
  }

  // Additional custom checks can be added here:
  // - Proof-of-attendance signature verification
  // - Cross-chain verification
  // - External API checks
  // - Rate limiting
  // - Reputation checks

  return Promise.resolve();
}

/**
 * Optional: Verify a receipt hash matches the expected input.
 * Useful for auditing and verification.
 */
export function verifyReceiptHash(
  input: IssuePassInput,
  expectedHash: string
): boolean {
  const computedHash = generateReceiptHash(input);
  return computedHash === expectedHash;
}