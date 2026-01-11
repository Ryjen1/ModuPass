import { createConfig } from '@krnl-dev/sdk-react-7702';
import { sepolia } from 'viem/chains';

// Get configuration from environment variables with validation
const delegatedAddress = process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS || "0x649457fc625E6c2a5E6581F4E8c9E5448529EdB7";
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// Validate required configuration
if (!privyAppId) {
  console.error('NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables');
}

/**
 * KRNL SDK Configuration
 * 
 * This configures the KRNL Protocol connection for ModuPass.
 * The SDK enables workflow execution, delegated account management,
 * and real-time monitoring through the KRNL Protocol.
 * 
 * Key features:
 * - EIP-7702 delegated account functionality
 * - Workflow execution via KRNL nodes
 * - Smart account capabilities on existing EOAs
 */
export const krnlConfig = createConfig({
  chain: sepolia,
  delegatedContractAddress: delegatedAddress as `0x${string}`,
  privyAppId: privyAppId as string,
  krnlNodeUrl: 'https://v0-1-0.node.lat/', // KRNL Protocol node endpoint
  // rpcUrl is optional – uses KRNL-optimized Privy RPC if not provided
});

export const CONTRACT_ADDRESS = delegatedAddress;