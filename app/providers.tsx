"use client";
import { ReactNode, useState } from "react";
import { base, baseSepolia } from "wagmi/chains";
import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { MiniAppProvider } from "./providers/MiniAppProvider";

const config = createConfig({
  chains: [baseSepolia, base],
  transports: { 
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [
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
