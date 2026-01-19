import { createConfig } from '@krnl-dev/sdk-react-7702';
import { sepolia } from 'viem/chains';

/**
 * Configure KRNL Protocol Connection
 * 
 * This configuration sets up the connection to the KRNL Protocol
 * with Privy authentication for EIP-7702 delegated accounts.
 * 
 * IMPORTANT: Use the delegated contract address from KRNL Studio
 * Contract address: 0x649457fc625E6c2a5E6581F4E8c9E5448529EdB7
 */

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
  throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is required');
}

export const krnlConfig = createConfig({
  chain: sepolia,
  delegatedContractAddress: (process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS || '0x649457fc625E6c2a5E6581F4E8c9E5448529EdB7') as `0x${string}`,
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  krnlNodeUrl: process.env.NEXT_PUBLIC_KRNL_NODE_URL || 'https://node.krnl.xyz',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
});

export default krnlConfig;