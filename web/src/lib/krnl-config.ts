import { createConfig } from '@krnl-dev/sdk-react-7702';
import { sepolia } from 'viem/chains';

if (!process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS is required');
}

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
  throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is required');
}

export const krnlConfig = createConfig({
  chain: sepolia,
  delegatedContractAddress: process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS as `0x${string}`,
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  krnlNodeUrl: process.env.NEXT_PUBLIC_KRNL_NODE_URL || 'https://node.krnl.xyz',
  // New auth credentials from KRNL Platform
  dappId: process.env.NEXT_PUBLIC_KRNL_DAPP_ID,
  entryKey: process.env.NEXT_PUBLIC_KRNL_ENTRY_ID, // Entry ID from dashboard
  accessToken: process.env.NEXT_PUBLIC_KRNL_ACCESS_TOKEN // Access Token from dashboard
});