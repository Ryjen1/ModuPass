'use client';

import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const queryClient = new QueryClient();

// Get from https://cloud.reown.com (formerly WalletConnect)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '5802b7fddf9247042eeecefe520d1df5';

// Create Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [sepolia],
  projectId,
});

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [sepolia],
  projectId,
  metadata: {
    name: 'ModuPass',
    description: 'KRNL-powered event attendance verification',
    url: 'https://modupass.app',
    icons: ['https://modupass.app/icon.png']
  },
  features: {
    analytics: true, // Enable analytics for Builder Rewards
  }
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}