/**
 * Example usage of the ModuPass kernel workflow.
 * This file demonstrates how to use the kernel in different scenarios.
 */

import { issuePassWorkflow, type EventConfig, type IssuePassInput } from "./index";

/**
 * Example 1: Basic pass issuance without event config
 */
async function example1_BasicIssuance() {
  console.log("\n=== Example 1: Basic Pass Issuance ===\n");

  const input: IssuePassInput = {
    eventId: "ethcc-2025-day1",
    attendeeAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  };

  try {
    const result = await issuePassWorkflow(input);
    console.log("✅ Pass issued successfully!");
    console.log("Workflow ID:", result.workflowId);
    console.log("Receipt Hash:", result.receiptHash);
    console.log("Metadata:", JSON.stringify(result.metadata, null, 2));
  } catch (error) {
    console.error("❌ Failed to issue pass:", error);
  }
}

/**
 * Example 2: Pass issuance with secret code
 */
async function example2_WithSecretCode() {
  console.log("\n=== Example 2: Pass Issuance with Secret Code ===\n");

  const eventConfig: EventConfig = {
    id: "private-event-001",
    name: "Private VIP Event",
    description: "Exclusive event for VIP members",
    organizer: "0x1852EBfaBA9CA73bd19760542B5Ab7278F495d0E",
    secretCode: "VIP2025",
  };

  const input: IssuePassInput = {
    eventId: "private-event-001",
    attendeeAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    claimData: {
      secretCode: "VIP2025",
    },
  };

  try {
    const result = await issuePassWorkflow(input, eventConfig);
    console.log("✅ Pass issued successfully with secret code!");
    console.log("Receipt Hash:", result.receiptHash);
  } catch (error) {
    console.error("❌ Failed to issue pass:", error);
  }
}

/**
 * Example 3: Pass issuance with allowlist
 */
async function example3_WithAllowlist() {
  console.log("\n=== Example 3: Pass Issuance with Allowlist ===\n");

  const eventConfig: EventConfig = {
    id: "allowlist-event",
    name: "Allowlist Only Event",
    description: "Event restricted to specific addresses",
    organizer: "0x1852EBfaBA9CA73bd19760542B5Ab7278F495d0E",
    allowlist: [
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "0x1852EBfaBA9CA73bd19760542B5Ab7278F495d0E",
    ],
  };

  const input: IssuePassInput = {
    eventId: "allowlist-event",
    attendeeAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  };

  try {
    const result = await issuePassWorkflow(input, eventConfig);
    console.log("✅ Pass issued successfully to allowlisted address!");
    console.log("Receipt Hash:", result.receiptHash);
  } catch (error) {
    console.error("❌ Failed to issue pass:", error);
  }
}

/**
 * Example 4: Pass issuance with time constraints
 */
async function example4_WithTimeConstraints() {
  console.log("\n=== Example 4: Pass Issuance with Time Constraints ===\n");

  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;
  const oneHourFromNow = now + 3600;

  const eventConfig: EventConfig = {
    id: "timed-event",
    name: "Time-Limited Event",
    description: "Event with specific start and end times",
    organizer: "0x1852EBfaBA9CA73bd19760542B5Ab7278F495d0E",
    startTime: oneHourAgo,
    endTime: oneHourFromNow,
  };

  const input: IssuePassInput = {
    eventId: "timed-event",
    attendeeAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  };

  try {
    const result = await issuePassWorkflow(input, eventConfig);
    console.log("✅ Pass issued during valid event time!");
    console.log("Receipt Hash:", result.receiptHash);
  } catch (error) {
    console.error("❌ Failed to issue pass:", error);
  }
}

/**
 * Example 5: Failed issuance - invalid address
 */
async function example5_InvalidAddress() {
  console.log("\n=== Example 5: Failed Issuance - Invalid Address ===\n");

  const input: IssuePassInput = {
    eventId: "test-event",
    attendeeAddress: "invalid-address", // Invalid Ethereum address
  };

  try {
    const result = await issuePassWorkflow(input);
    console.log("❌ This should not succeed!");
  } catch (error) {
    console.log("✅ Correctly rejected invalid address:");
    console.log("   Error:", (error as Error).message);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  await example1_BasicIssuance();
  await example2_WithSecretCode();
  await example3_WithAllowlist();
  await example4_WithTimeConstraints();
  await example5_InvalidAddress();
  
  console.log("\n=== All Examples Complete ===\n");
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_BasicIssuance,
  example2_WithSecretCode,
  example3_WithAllowlist,
  example4_WithTimeConstraints,
  example5_InvalidAddress,
};