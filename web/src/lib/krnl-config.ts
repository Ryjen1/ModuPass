import { KRNLProvider } from '@krnl/sdk';
import { sepolia } from 'viem/chains';

// Get configuration from environment variables with validation
const delegatedAddress = process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS || "0x649457fc625E6c2a5E6581F4E8c9E5448529EdB7";
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const krnlApiKey = process.env.KRNL_API_KEY;

// Validate required configuration
if (!privyAppId) {
  throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is required');
}
if (!krnlApiKey) {
  throw new Error('KRNL_API_KEY is required for real KRNL integration');
}

/**
 * KRNL SDK Configuration
 *
 * Official KRNL SDK configuration for ModuPass.
 * No self-hosted fallbacks - requires real KRNL API credentials.
 */
export const krnlConfig = {
  apiKey: krnlApiKey,
  chain: sepolia,
  delegatedContractAddress: delegatedAddress as `0x${string}`,
  privyAppId: privyAppId as string,
  // Disable any self-hosted modes
  enableSelfHosted: false,
};

export const CONTRACT_ADDRESS = delegatedAddress;