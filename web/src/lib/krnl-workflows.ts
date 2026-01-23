/**
 * KRNL Workflow Templates for ModuPass
 * 
 * This module defines workflow templates using KRNL's Domain-Specific Language (DSL)
 * for event creation and attendance verification operations.
 * 
 * IMPORTANT: Workflows must be pre-created in KRNL Studio (https://studio.krnl.xyz)
 * before use. The workflow IDs should be stored in environment variables.
 */

import type { WorkflowObject } from '@krnl-dev/sdk-react-7702';

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
 * Get workflow IDs from environment
 * These IDs are obtained from KRNL Studio after creating workflows
 */
export const KRNL_WORKFLOW_IDS = {
  createEvent: process.env.NEXT_PUBLIC_KRNL_CREATE_EVENT_WORKFLOW_ID,
  verifyAttendance: process.env.NEXT_PUBLIC_KRNL_VERIFY_ATTENDANCE_WORKFLOW_ID
};

/**
 * Validate that required workflow IDs are configured
 */
export function validateWorkflowConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!KRNL_WORKFLOW_IDS.createEvent) {
    missing.push('NEXT_PUBLIC_KRNL_CREATE_EVENT_WORKFLOW_ID');
  }
  
  if (!KRNL_WORKFLOW_IDS.verifyAttendance) {
    missing.push('NEXT_PUBLIC_KRNL_VERIFY_ATTENDANCE_WORKFLOW_ID');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}