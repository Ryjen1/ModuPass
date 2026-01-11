'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { KRNLProvider } from '@krnl-dev/sdk-react-7702';
import { krnlConfig } from '@/lib/krnl-config';

// Wagmi Config
const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
});

// Privy App ID
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmikgobrw03dzkw0bj7jkhy8a';

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!PRIVY_APP_ID || PRIVY_APP_ID.length < 20) {
      console.error('Invalid NEXT_PUBLIC_PRIVY_APP_ID');
      setHasError(true);
    }
  }, []);

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'apple'],
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
          logo: 'https://modu-pass.vercel.app/logo.png',
        },
        supportedChains: [sepolia],
        defaultChain: sepolia,
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        externalWallets: {
          disableAllExternalWallets: true
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <KRNLProvider config={krnlConfig}>
            {children}
            {hasError && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-red-900/90 text-white p-8 rounded-lg max-w-md text-center">
                  <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
                  <p>Invalid NEXT_PUBLIC_PRIVY_APP_ID</p>
                  <p className="text-sm mt-2">Check your .env.local file</p>
                </div>
              </div>
            )}
          </KRNLProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}