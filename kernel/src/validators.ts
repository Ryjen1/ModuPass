/**
 * Validation utilities for ModuPass kernel workflow.
 */

import type { EventConfig, ClaimData, EligibilityCheckResult } from "./types";

/**
 * Checks if an event is currently active based on start/end times.
 */
export function isEventActive(eventConfig: EventConfig): EligibilityCheckResult {
  const now = Date.now() / 1000; // Convert to seconds

  if (eventConfig.startTime && now < eventConfig.startTime) {
    return {
      passed: false,
      reason: `Event has not started yet. Starts at ${new Date(eventConfig.startTime * 1000).toISOString()}`,
      checkName: "event_timing",
    };
  }

  if (eventConfig.endTime && now > eventConfig.endTime) {
    return {
      passed: false,
      reason: `Event has ended. Ended at ${new Date(eventConfig.endTime * 1000).toISOString()}`,
      checkName: "event_timing",
    };
  }

  return {
    passed: true,
    checkName: "event_timing",
  };
}

/**
 * Verifies the secret code if required by the event.
 */
export function verifySecretCode(
  eventConfig: EventConfig,
  claimData?: ClaimData
): EligibilityCheckResult {
  // If event doesn't require a secret code, pass
  if (!eventConfig.secretCode) {
    return {
      passed: true,
      checkName: "secret_code",
    };
  }

  // If event requires secret code but none provided
  if (!claimData?.secretCode) {
    return {
      passed: false,
      reason: "This event requires a secret code to claim a pass",
      checkName: "secret_code",
    };
  }

  // Verify the code matches
  if (claimData.secretCode !== eventConfig.secretCode) {
    return {
      passed: false,
      reason: "Invalid secret code provided",
      checkName: "secret_code",
    };
  }

  return {
    passed: true,
    checkName: "secret_code",
  };
}

/**
 * Checks if the attendee is on the allowlist (if allowlist exists).
 */
export function checkAllowlist(
  eventConfig: EventConfig,
  attendeeAddress: string
): EligibilityCheckResult {
  // If no allowlist, everyone is allowed
  if (!eventConfig.allowlist || eventConfig.allowlist.length === 0) {
    return {
      passed: true,
      checkName: "allowlist",
    };
  }

  // Normalize addresses for comparison
  const normalizedAttendee = attendeeAddress.toLowerCase();
  const isAllowed = eventConfig.allowlist.some(
    (addr) => addr.toLowerCase() === normalizedAttendee
  );

  if (!isAllowed) {
    return {
      passed: false,
      reason: "Attendee address is not on the allowlist for this event",
      checkName: "allowlist",
    };
  }

  return {
    passed: true,
    checkName: "allowlist",
  };
}

/**
 * Validates Ethereum address format.
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates event ID format.
 */
export function isValidEventId(eventId: string): boolean {
  return (
    typeof eventId === "string" &&
    eventId.length > 0 &&
    eventId.length <= 100 &&
    /^[a-zA-Z0-9-_]+$/.test(eventId)
  );
}