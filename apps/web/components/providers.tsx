"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { TradeRoutesProvider } from "../lib/trade-routes-context";

const { networkConfig } = createNetworkConfig({
  devnet: { network: "devnet", url: getJsonRpcFullnodeUrl("devnet") },
  testnet: { network: "testnet", url: getJsonRpcFullnodeUrl("testnet") },
  mainnet: { network: "mainnet", url: getJsonRpcFullnodeUrl("mainnet") },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <TradeRoutesProvider>{children}</TradeRoutesProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
