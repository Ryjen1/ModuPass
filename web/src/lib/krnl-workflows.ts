/**
 * KRNL Workflow DSL Template for Event Creation
 * This template defines the workflow for creating events with KRNL authorization
 */

export interface KRNLWorkflowTemplate {
    chain_id: number;
    sender: string;
    contract: string;
    function: string;
    parameters: any[];
    sponsor_execution_fee: boolean;
    value: string;
    rpc_url: string;
    gas_limit: string;
    workflow?: {
        steps: Array<{
            name: string;
            type: string;
            inputs?: Record<string, any>;
            outputs?: Record<string, any>;
        }>;
    };
}

/**
 * Create a KRNL workflow template for event creation
 * @param eventId - Unique event identifier
 * @param eventName - Name of the event
 * @param merkleRoot - Merkle root of verification codes
 * @param maxAttendees - Maximum number of attendees
 * @param senderAddress - Address of the event creator
 * @param contractAddress - ModuPassTargetBase contract address
 * @returns KRNL workflow DSL template
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
            steps: [
                {
                    name: "validate_event_data",
                    type: "validation",
                    inputs: {
                        eventId,
                        eventName,
                        maxAttendees
                    },
                    outputs: {
                        validated: true
                    }
                },
                {
                    name: "prepare_auth_data",
                    type: "auth_preparation",
                    inputs: {
                        eventId,
                        eventName,
                        codesMerkleRoot: merkleRoot,
                        maxAttendees
                    },
                    outputs: {
                        authData: "prepared"
                    }
                },
                {
                    name: "execute_create_event",
                    type: "contract_call",
                    inputs: {
                        contract: contractAddress,
                        function: "createEvent",
                        authData: "$steps.prepare_auth_data.outputs.authData"
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
