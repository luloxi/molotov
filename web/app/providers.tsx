"use client";
import { ReactNode, useState } from "react";
import { base, baseSepolia } from "wagmi/chains";
import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected, coinbaseWallet, metaMask } from "wagmi/connectors";
import { MiniAppProvider } from "./providers/MiniAppProvider";

/**
 * Wagmi configuration with wallet connectors.
 * 
 * Note: Coinbase Wallet SDK may attempt to load analytics from cca-lite.coinbase.com,
 * which can be blocked by ad blockers. This is harmless and doesn't affect functionality.
 * The ErrorFilter component suppresses these console errors.
 */
const config = createConfig({
  chains: [baseSepolia, base],
  transports: { 
    [base.id]: http(),
    // Use PublicNode's free RPC as fallback since other RPCs can be unreliable or require API keys
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://base-sepolia-rpc.publicnode.com'),
  },
  connectors: [
    metaMask(),
    injected(),
    coinbaseWallet({ appName: "Molotov Gallery" }),
    farcasterMiniApp(),
  ],
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MiniAppProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </MiniAppProvider>
  );
}
