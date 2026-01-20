import {
  createEventStudioWorkflow,
  verifyAttendanceStudioWorkflow,
  injectWorkflowParams
} from './krnl-workflows-studio';

/**
 * Create Event Workflow
 * Injects parameters for KRNL Studio workflow
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
 * Injects parameters for KRNL Studio workflow
 */
export function verifyAttendanceWorkflowDSL(params: {
  contractAddress: string;
  eventId: string;
  attendeeAddress: string;
  code: string;
}) {
  return injectWorkflowParams(verifyAttendanceStudioWorkflow, {
    CONTRACT_ADDRESS: params.contractAddress,
    EVENT_ID: params.eventId,
    ATTENDEE_ADDRESS: params.attendeeAddress,
    CODE: params.code
  });
}
