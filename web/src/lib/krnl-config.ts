import { createConfig } from '@krnl-dev/sdk-react-7702';
import { sepolia } from 'viem/chains';

// Provide fallback values for build time to prevent static generation crashes
const delegatedAddress = process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS || "0x0000000000000000000000000000000000000000";
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmikgobrw03dzkw0bj7jkhy8a";

// Export constants for UI validation (Moved OUTSIDE the object)
export const KRNL_DAPP_ID = 9860;
export const KRNL_ENTRY_KEY = "0x9e4e02c291a264ba692219ed55bbc98d195c9fd40836ba2786a1ef3f6373212a";
export const KRNL_ACCESS_TOKEN = "0x4401f104994510bf927e43f0ec95220e0ba711844085c2378ea8450bd0f42713026e0992ca06f72837b3badd057802a2e95c2a8e694abac01d2c4919bd63a6fa1b";

export const krnlConfig = createConfig({
  chain: sepolia,
  delegatedContractAddress: delegatedAddress as `0x${string}`,
  privyAppId: privyAppId,
  krnlNodeUrl: 'https://node.krnl.xyz',
  // @ts-ignore - Types are missing these fields but runtime uses them
  dappId: KRNL_DAPP_ID,
  entryKey: KRNL_ENTRY_KEY,
  accessToken: KRNL_ACCESS_TOKEN
});