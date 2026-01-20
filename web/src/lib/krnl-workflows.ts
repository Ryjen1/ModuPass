/**
 * KRNL Workflow Parameters for ModuPass
 * 
 * This module defines parameter helpers for KRNL workflows.
 * Workflows are executed directly via DSL, not via Studio workflow IDs.
 */

/**
 * Create event workflow parameters
 * These will be injected into the KRNL Studio workflow template
 */
export interface CreateEventParams {
  eventId: string;
  eventName: string;
  merkleRoot: string;
  maxAttendees: number;
  contractAddress: string;
}

/**
 * Verify attendance workflow parameters
 */
export interface VerifyAttendanceParams {
  eventId: string;
  attendeeAddress: string;
  code: string;
  contractAddress: string;
}

/**
 * Create a parameter object for event creation workflow
 * 
 * This generates the parameters that will be injected into the 
 * KRNL Studio workflow template created for event creation.
 * 
 * @param params - Event creation parameters
 * @returns Parameters object for KRNL workflow template
 */
export function createEventWorkflowParams(
  params: CreateEventParams
): Record<string, string | number> {
  return {
    "{{CONTRACT_ADDRESS}}": params.contractAddress,
    "{{EVENT_ID}}": params.eventId,
    "{{EVENT_NAME}}": params.eventName,
    "{{MERKLE_ROOT}}": params.merkleRoot,
    "{{MAX_ATTENDEES}}": params.maxAttendees
  };
}

/**
 * Create a parameter object for attendance verification workflow
 * 
 * @param params - Verification parameters
 * @returns Parameters object for KRNL workflow template
 */
export function verifyAttendanceWorkflowParams(
  params: VerifyAttendanceParams
): Record<string, string> {
  return {
    "{{CONTRACT_ADDRESS}}": params.contractAddress,
    "{{EVENT_ID}}": params.eventId,
    "{{ATTENDEE_ADDRESS}}": params.attendeeAddress,
    "{{CODE}}": params.code,
    "{{TIMESTAMP}}": Math.floor(Date.now() / 1000).toString()
  };
}

/**
 * Validate contract address is configured
 */
export function validateWorkflowConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS) {
    missing.push('NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}