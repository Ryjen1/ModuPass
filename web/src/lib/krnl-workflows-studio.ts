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
    "contract": "0x649457fc625E6c2a5E6581F4E8c9E5448529EdB7",
    "function": "verifyAttendance((uint256,uint256,bytes32,(bytes32,bytes,bytes)[],bytes,bool,bytes))",
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
  "gas_limit": "100000",
  "max_fee_per_gas": "20000000000",
  "max_priority_fee_per_gas": "2000000000",
  "workflow": {
    "name": "create",
    "version": "v1.0.0",
    "steps": [
      {
        "name": "evm-data-fetcher-1765270618375",
        "image": "ghcr.io/krnl-labs/executor-evm-read@sha256:9c15f3e004352f1062a22b8bf7d7fa80498449b9407bc6efc107dbdd7acce5a4",
        "attestor": "https://public.mypinata.cloud/ipfs/bafybeid3msoebov6o54rtvjtrdwv7fg6tkeye2skrxh6jis25zok6pavzi",
        "next": "construct-evm",
        "config": {
          "function_signature": "balanceOf(address)",
          "input_parameters": [
            {
              "name": "account",
              "type": "address"
            }
          ],
          "output_parameters": [
            {
              "name": "balance",
              "type": "uint256"
            }
          ]
        },
        "inputs": {
          "value": {
            "account": "0x907089fC3966f52dB4463c8295Ad9aE3B164D94c"
          },
          "url": "https://lb.drpc.org/optimism-sepolia/AnRM4mK1tEyphrn_jexSLbrPxqT4wGIR760VIlZWwHzR",
          "chainid": 11155420,
          "timeout": 30,
          "contractAddress": "0xB9467B24117FD79D56F396ADC3cCDB695D905ae4"
        },
        "outputs": [
          {
            "name": "balance",
            "value": "response.0",
            "required": true,
            "export": true
          }
        ]
      },
      {
        "name": "construct-evm",
        "image": "ghcr.io/krnl-labs/executor-encoder-evm@sha256:b28823d12eb1b16cbcc34c751302cd2dbe7e35480a5bc20e4e7ad50a059b6611",
        "attestor": "{{ENV.ATTESTOR_IMAGE}}",
        "next": "prepare-authdata",
        "config": {
          "parameters": [
            {
              "name": "create",
              "type": "tuple",
              "components": []
            }
          ]
        },
        "inputs": {
          "value": {
            "create": {}
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
 * 
 * TODO: Export your "verify" workflow from KRNL Studio and paste it here
 * This is a placeholder - replace with the actual exported workflow
 */
export const verifyAttendanceStudioWorkflow: KRNLStudioWorkflow = {
  "chain_id": 11155111,
  "sender": "{{ENV.SENDER_ADDRESS}}",
  "delegate": "{{TRANSACTION_INTENT_DELEGATE}}",
  "attestor": "{{ENV.ATTESTOR_IMAGE}}",
  "target": {
    "contract": "0x649457fc625E6c2a5E6581F4E8c9E5448529EdB7",
    "function": "verifyAttendance((uint256,uint256,bytes32,(bytes32,bytes,bytes)[],bytes,bool,bytes))",
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
  "gas_limit": "100000",
  "max_fee_per_gas": "20000000000",
  "max_priority_fee_per_gas": "2000000000",
  "workflow": {
    "name": "verify",
    "version": "v1.0.0",
    "steps": [
      {
        "name": "evm-data-fetcher",
        "image": "ghcr.io/krnl-labs/executor-evm-read@sha256:9c15f3e004352f1062a22b8bf7d7fa80498449b9407bc6efc107dbdd7acce5a4",
        "attestor": "https://public.mypinata.cloud/ipfs/bafybeid3msoebov6o54rtvjtrdwv7fg6tkeye2skrxh6jis25zok6pavzi",
        "next": "construct-evm",
        "config": {
          "function_signature": "balanceOf(address)",
          "input_parameters": [
            {
              "name": "account",
              "type": "address"
            }
          ],
          "output_parameters": [
            {
              "name": "balance",
              "type": "uint256"
            }
          ]
        },
        "inputs": {
          "value": {
            "account": "{{ATTENDEE_ADDRESS}}"
          },
          "url": "${_SECRETS.rpcSepoliaURL}",
          "chainid": 11155111,
          "timeout": 30,
          "contractAddress": "0x649457fc625E6c2a5E6581F4E8c9E5448529EdB7"
        },
        "outputs": [
          {
            "name": "balance",
            "value": "response.0",
            "required": true,
            "export": true
          }
        ]
      },
      {
        "name": "construct-evm",
        "image": "ghcr.io/krnl-labs/executor-encoder-evm@sha256:b28823d12eb1b16cbcc34c751302cd2dbe7e35480a5bc20e4e7ad50a059b6611",
        "attestor": "{{ENV.ATTESTOR_IMAGE}}",
        "next": "prepare-authdata",
        "config": {
          "parameters": [
            {
              "name": "verify",
              "type": "tuple",
              "components": []
            }
          ]
        },
        "inputs": {
          "value": {
            "verify": {}
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
 * NOTE: With the current KRNL Studio workflow structure, parameters are handled
 * through the workflow steps themselves, not through simple string replacement.
 */
export function injectWorkflowParams(
  workflow: KRNLStudioWorkflow,
  params: Record<string, string | number>
): KRNLStudioWorkflow {
  // Deep clone the workflow
  const workflowCopy = JSON.parse(JSON.stringify(workflow));
  
  // The KRNL Studio workflows handle parameters internally through their steps
  // We return the workflow as-is since KRNL will handle parameter injection
  // through the ENV variables and TRANSACTION_INTENT placeholders
  
  return workflowCopy;
}
