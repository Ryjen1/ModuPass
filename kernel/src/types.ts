/**
 * Type definitions for ModuPass kernel workflow.
 */

export interface EventConfig {
  id: string;
  name: string;
  description: string;
  startTime?: number; // Unix timestamp
  endTime?: number; // Unix timestamp
  organizer: string; // Ethereum address
  secretCode?: string; // Optional secret code for claiming
  allowlist?: string[]; // Optional list of allowed addresses
  maxPasses?: number; // Optional maximum number of passes
}

export interface ClaimData {
  secretCode?: string;
  signature?: string;
  proofOfAttendance?: {
    type: "qr" | "signature" | "location" | "custom";
    data: string;
  };
  metadata?: Record<string, unknown>;
}

export interface WorkflowReceipt {
  version: string;
  eventId: string;
  attendeeAddress: string;
  claimData: Record<string, unknown>;
  timestamp: number;
  workflowVersion: string;
}

export interface EligibilityCheckResult {
  passed: boolean;
  reason?: string;
  checkName: string;
}

export interface WorkflowContext {
  eventConfig?: EventConfig;
  eligibilityChecks: EligibilityCheckResult[];
  startTime: number;
  endTime?: number;
}