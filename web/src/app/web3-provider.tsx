'use client';

import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { KRNLProvider } from '@krnl-dev/sdk-react-7702';
import { krnlConfig } from '@/lib/krnl-config';

const queryClient = new QueryClient();

// Wagmi Config using @privy-io/wagmi
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Missing NEXT_PUBLIC_PRIVY_APP_ID configuration
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'google', 'apple'],
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
          logo: 'https://modupass.app/logo.png',
        },
        supportedChains: [sepolia],
        defaultChain: sepolia,
        embeddedWallets: {
          createOnLogin: 'all-users',
          noPromptOnSignature: true,
        },
        externalWallets: {
          // CRITICAL: KRNL requires EIP-7702 which only Privy Embedded Wallets support right now.
          // We disable external wallets to force the user into the correct flow.
          disableAllExternalWallets: true
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <KRNLProvider config={krnlConfig}>
            {children}
          </KRNLProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}