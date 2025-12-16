import { KRNL_DAPP_ID, KRNL_ACCESS_TOKEN } from "./krnl-config";

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
        gas_limit: "500000",
        workflow: {
            // Minimal pass-through workflow to satisfy validation
            steps: [
                {
                    name: "execute_create_event",
                    type: "contract_call", // Standard type
                    inputs: {
                        contract: contractAddress,
                        function: "createEvent",
                        parameters: [
                            eventId,
                            eventName,
                            merkleRoot,
                            maxAttendees
                        ]
                    }
                }
            ]
        }
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
        gas_limit: "300000",
        workflow: {
            steps: [
                {
                    name: "validate_code",
                    type: "merkle_verification",
                    inputs: {
                        eventId,
                        code
                    },
                    outputs: {
                        isValid: true
                    }
                },
                {
                    name: "prepare_attendance_data",
                    type: "auth_preparation",
                    inputs: {
                        eventId,
                        attendee: attendeeAddress,
                        code,
                        isValid: "$steps.validate_code.outputs.isValid"
                    }
                },
                {
                    name: "execute_verify_attendance",
                    type: "contract_call",
                    inputs: {
                        contract: contractAddress,
                        function: "verifyAttendance",
                        authData: "$steps.prepare_attendance_data.outputs.authData"
                    }
                }
            ]
        }
    };
}
