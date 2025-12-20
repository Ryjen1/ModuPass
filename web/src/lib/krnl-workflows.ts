import { KRNL_DAPP_ID, KRNL_ACCESS_TOKEN } from "./krnl-config";
import { ethers, AbiCoder } from "ethers";

/**
 * KRNL Workflow DSL Template for Event Creation
 * This template defines the workflow for creating events with KRNL authorization
 */

export interface KRNLWorkflowTemplate {
    kernelIds?: number[];
    dappId?: number;
    accessToken?: string;
    chain_id: number;
    sender: string;
    contract: string;
    function: string;
    parameters: any[];
    sponsor_execution_fee: boolean;
    value: string;
    rpc_url: string;
    gas_limit: string;
    // ...
}

/**
 * Create a KRNL workflow template for event creation
 * @param eventId - Unique event identifier
 * @param eventName - Name of the event
// ... (keeping comments)
 */
export function createEventWorkflowTemplate(
    eventId: string,
    eventName: string,
    merkleRoot: string,
    maxAttendees: number,
    senderAddress: string,
    contractAddress: string
): KRNLWorkflowTemplate {
    return {
        kernelIds: [337],
        dappId: KRNL_DAPP_ID, // Inject manually to ensure it's there
        accessToken: KRNL_ACCESS_TOKEN, // Inject manually to ensure it's there
        chain_id: 11155111, // Sepolia
        sender: senderAddress,
        contract: contractAddress,
        function: "createEvent",
        parameters: [
            {
                // AuthData struct will be constructed by KRNL
                eventId,
                eventName,
                codesMerkleRoot: merkleRoot,
                maxAttendees
            }
        ],
        sponsor_execution_fee: false,
        value: "0",
        rpc_url: process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
        gas_limit: "500000"
    };
}

/**
 * Create a KRNL workflow template for attendance verification
 * @param eventId - Event identifier
 * @param attendeeAddress - Address of the attendee
 * @param code - Verification code
 * @param senderAddress - Address initiating the verification
 * @param contractAddress - ModuPassTargetBase contract address
 * @returns KRNL workflow DSL template
 */
export function verifyAttendanceWorkflowTemplate(
    eventId: string,
    attendeeAddress: string,
    code: string,
    senderAddress: string,
    contractAddress: string
): KRNLWorkflowTemplate {
    return {
        chain_id: 11155111, // Sepolia
        sender: senderAddress,
        contract: contractAddress,
        function: "verifyAttendance",
        parameters: [
            {
                eventId,
                attendee: attendeeAddress,
                code,
                timestamp: Math.floor(Date.now() / 1000),
                isValid: true // Will be validated by KRNL workflow
            }
        ],
        sponsor_execution_fee: false,
        value: "0",
        rpc_url: process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
        gas_limit: "300000"
    };
}

/**
 * Generate Mock AuthData for Simulation Mode
 * This bypasses KRNL signature/proof generation but constructs a valid AuthData structure
 * that the ModuPassDemo contract (permissive) will accept.
 */


export async function getMockAuthData(
    functionName: "createEvent" | "verifyAttendance",
    params: any
): Promise<any> {
    const abiCoder = new AbiCoder();
    let resultBytes = "0x";

    if (functionName === "createEvent") {
        // Encode parameters for createEvent: (string, string, string, uint256)
        resultBytes = abiCoder.encode(
            ["string", "string", "string", "uint256"],
            [
                params.eventId,
                params.eventName,
                params.merkleRoot,
                params.maxAttendees
            ]
        );
    } else if (functionName === "verifyAttendance") {
        // Encode parameters for verifyAttendance: (string, address, string)
        resultBytes = abiCoder.encode(
            ["string", "address", "string"],
            [
                params.eventId,
                params.attendee,
                params.code
            ]
        );
    }

    // Return AuthData struct matching ModuPassTargetBase ABI
    return {
        nonce: BigInt(Math.floor(Date.now() / 1000)),
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour valid
        id: ethers.id("mock-workflow"), // Maps to 'id' in ABI
        executions: [], // bytes32[]
        result: resultBytes,
        sponsorExecutionFee: false,
        signature: "0x"
    };
}
