/**
 * KRNL Workflow DSL Definitions for ModuPass
 * 
 * These workflows use the configurations created in KRNL Studio.
 * The workflows are exported from Studio and injected with runtime parameters.
 */

import { 
  createEventStudioWorkflow, 
  verifyAttendanceStudioWorkflow,
  injectWorkflowParams
} from './krnl-workflows-studio';

/**
 * Create Event Workflow
 * Uses the "create" workflow from KRNL Studio
 */
export function createEventWorkflowDSL(params: {
  contractAddress: string;
  eventId: string;
  eventName: string;
  merkleRoot: string;
  maxAttendees: number;
}) {
  return injectWorkflowParams(createEventStudioWorkflow, {
    CONTRACT_ADDRESS: params.contractAddress,
    EVENT_ID: params.eventId,
    EVENT_NAME: params.eventName,
    MERKLE_ROOT: params.merkleRoot,
    MAX_ATTENDEES: params.maxAttendees
  });
}

/**
 * Verify Attendance Workflow
 * Uses the "verify" workflow from KRNL Studio
 */
export function verifyAttendanceWorkflowDSL(params: {
  contractAddress: string;
  eventId: string;
  attendeeAddress: string;
  code: string;
}) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  return injectWorkflowParams(verifyAttendanceStudioWorkflow, {
    CONTRACT_ADDRESS: params.contractAddress,
    EVENT_ID: params.eventId,
    ATTENDEE_ADDRESS: params.attendeeAddress,
    CODE: params.code,
    TIMESTAMP: timestamp
  });
}
