/**
 * KRNL Studio Workflow Configurations
 * 
 * These are the actual workflows exported from KRNL Studio.
 * The workflows are complete with all steps and configurations.
 */

export interface KRNLStudioWorkflow {
  chain_id: number;
  sender?: string;
  delegate?: string;
  attestor?: string;
  target: {
    contract: string;
    function: string;
    authData_result?: string;
    parameters: any[];
  };
  sponsor_execution_fee: boolean;
  value: string;
  intent?: {
    id: string;
    signature: string;
    deadline: string;
  };
  rpc_url: string;
  bundler_url: string;
  paymaster_url: string;
  gas_limit: string;
  max_fee_per_gas: string;
  max_priority_fee_per_gas: string;
  workflow: {
    name: string;
    version: string;
    steps: any[];
  };
}

/**
 * Create Event Workflow (exported from KRNL Studio)
 */
export const createEventStudioWorkflow: KRNLStudioWorkflow = {
  "chain_id": 11155111,
  "sender": "{{ENV.SENDER_ADDRESS}}",
  "delegate": "{{TRANSACTION_INTENT_DELEGATE}}",
  "attestor": "{{ENV.ATTESTOR_IMAGE}}",
  "target": {
    "contract": "{{CONTRACT_ADDRESS}}",
    "function": "createEvent((uint256,uint256,bytes32,bytes32[],bytes,bool,bytes))",
    "authData_result": "${construct-evm.result}",
    "parameters": []
  },
  "sponsor_execution_fee": true,
  "value": "0",
  "intent": {
    "id": "{{TRANSACTION_INTENT_ID}}",
    "signature": "{{USER_SIGNATURE}}",
    "deadline": "{{TRANSACTION_INTENT_DEADLINE}}"
  },
  "rpc_url": "${_SECRETS.rpcSepoliaURL}",
  "bundler_url": "https://api.pimlico.io/v2/sepolia/rpc?apikey=${_SECRETS.pimlico-apikey}",
  "paymaster_url": "https://api.pimlico.io/v2/sepolia/rpc?apikey=${_SECRETS.pimlico-apikey}",
  "gas_limit": "200000",
  "max_fee_per_gas": "20000000000",
  "max_priority_fee_per_gas": "2000000000",
  "workflow": {
    "name": "create",
    "version": "v1.0.0",
    "steps": [
      {
        "name": "construct-evm",
        "image": "ghcr.io/krnl-labs/executor-encoder-evm@sha256:b28823d12eb1b16cbcc34c751302cd2dbe7e35480a5bc20e4e7ad50a059b6611",
        "attestor": "{{ENV.ATTESTOR_IMAGE}}",
        "next": "prepare-authdata",
        "config": {
          "parameters": [
            { "name": "eventId", "type": "string" },
            { "name": "eventName", "type": "string" },
            { "name": "merkleRoot", "type": "bytes32" },
            { "name": "maxAttendees", "type": "uint256" }
          ]
        },
        "inputs": {
          "value": {
            "eventId": "{{EVENT_ID}}",
            "eventName": "{{EVENT_NAME}}",
            "merkleRoot": "{{MERKLE_ROOT}}",
            "maxAttendees": "{{MAX_ATTENDEES}}"
          }
        },
        "outputs": [
          {
            "name": "result",
            "value": "result",
            "required": true,
            "export": true
          }
        ]
      }
    ]
  }
};

/**
 * Verify Attendance Workflow (exported from KRNL Studio)
 */
export const verifyAttendanceStudioWorkflow: KRNLStudioWorkflow = {
  "chain_id": 11155111,
  "sender": "{{ENV.SENDER_ADDRESS}}",
  "delegate": "{{TRANSACTION_INTENT_DELEGATE}}",
  "attestor": "{{ENV.ATTESTOR_IMAGE}}",
  "target": {
    "contract": "{{CONTRACT_ADDRESS}}",
    "function": "verifyAttendance((uint256,uint256,bytes32,bytes32[],bytes,bool,bytes))",
    "authData_result": "${construct-evm.result}",
    "parameters": []
  },
  "sponsor_execution_fee": true,
  "value": "0",
  "intent": {
    "id": "{{TRANSACTION_INTENT_ID}}",
    "signature": "{{USER_SIGNATURE}}",
    "deadline": "{{TRANSACTION_INTENT_DEADLINE}}"
  },
  "rpc_url": "${_SECRETS.rpcSepoliaURL}",
  "bundler_url": "https://api.pimlico.io/v2/sepolia/rpc?apikey=${_SECRETS.pimlico-apikey}",
  "paymaster_url": "https://api.pimlico.io/v2/sepolia/rpc?apikey=${_SECRETS.pimlico-apikey}",
  "gas_limit": "200000",
  "max_fee_per_gas": "20000000000",
  "max_priority_fee_per_gas": "2000000000",
  "workflow": {
    "name": "verify",
    "version": "v1.0.0",
    "steps": [
      {
        "name": "construct-evm",
        "image": "ghcr.io/krnl-labs/executor-encoder-evm@sha256:b28823d12eb1b16cbcc34c751302cd2dbe7e35480a5bc20e4e7ad50a059b6611",
        "attestor": "{{ENV.ATTESTOR_IMAGE}}",
        "next": "prepare-authdata",
        "config": {
          "parameters": [
            { "name": "eventId", "type": "string" },
            { "name": "attendeeAddress", "type": "address" },
            { "name": "code", "type": "string" }
          ]
        },
        "inputs": {
          "value": {
            "eventId": "{{EVENT_ID}}",
            "attendeeAddress": "{{ATTENDEE_ADDRESS}}",
            "code": "{{CODE}}"
          }
        },
        "outputs": [
          {
            "name": "result",
            "value": "result",
            "required": true,
            "export": true
          }
        ]
      }
    ]
  }
};

/**
 * Helper to inject parameters into workflow
 * Performs simple string replacement for placeholders like {{KEY}}
 */
export function injectWorkflowParams(
  workflow: KRNLStudioWorkflow,
  params: Record<string, string | number>
): KRNLStudioWorkflow {
  // Convert workflow to string for replacement
  let workflowStr = JSON.stringify(workflow);

  // Replace each parameter
  Object.entries(params).forEach(([key, value]) => {
    // Create regex to replace all instances of {{KEY}}
    // Handles numeric values by removing quotes if needed, 
    // but simpler to just replace value first as string.
    // If the target is string type in JSON, strict replacement works.

    // Safety check for null/undefined
    const valStr = value === null || value === undefined ? "" : String(value);

    const regex = new RegExp(`{{${key}}}`, 'g');
    workflowStr = workflowStr.replace(regex, valStr);
  });

  // Parse back to object
  return JSON.parse(workflowStr);
}
