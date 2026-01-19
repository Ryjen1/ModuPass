/**
 * KRNL Workflow DSL for ModuPass
 * 
 * This module defines workflow DSL objects for KRNL Protocol.
 * Workflows are executed entirely by KRNL - no direct contract calls needed.
 * 
 * IMPORTANT: KRNL handles the contract interaction. Do NOT call writeContractAsync
 * after executing a workflow - KRNL does this automatically.
 */

/**
 * Create event workflow DSL
 * 
 * KRNL will execute this workflow and handle the contract interaction.
 * The workflow returns AuthData which contains the transaction result.
 * 
 * @param eventId - Unique event identifier
 * @param eventName - Event display name
 * @param merkleRoot - Merkle root of verification codes
 * @param maxAttendees - Maximum number of attendees
 * @param contractAddress - ModuPass contract address
 * @returns Workflow DSL object for KRNL
 */
export function createEventWorkflow(
  eventId: string,
  eventName: string,
  merkleRoot: string,
  maxAttendees: number,
  contractAddress: string
) {
  return {
    action: "create_event",
    params: {
      contract_address: contractAddress,
      event_id: eventId,
      event_name: eventName,
      merkle_root: merkleRoot,
      max_attendees: maxAttendees,
      function_name: "createEvent",
      // Include ABI signature for the function
      function_signature: "createEvent(bytes32,string,bytes32,uint256)"
    }
  };
}

/**
 * Verify attendance workflow DSL
 * 
 * KRNL will execute this workflow and handle the contract interaction.
 * 
 * @param eventId - Event identifier
 * @param attendeeAddress - Attendee wallet address
 * @param verificationCode - Verification code to validate
 * @param contractAddress - ModuPass contract address
 * @returns Workflow DSL object for KRNL
 */
export function verifyAttendanceWorkflow(
  eventId: string,
  attendeeAddress: string,
  verificationCode: string,
  contractAddress: string
) {
  return {
    action: "verify_attendance",
    params: {
      contract_address: contractAddress,
      event_id: eventId,
      attendee_address: attendeeAddress,
      verification_code: verificationCode,
      timestamp: Math.floor(Date.now() / 1000),
      function_name: "verifyAttendance",
      // Include ABI signature for the function
      function_signature: "verifyAttendance(bytes32,address,string)"
    }
  };
}