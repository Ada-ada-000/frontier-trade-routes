"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function WalletPanel({ compact = false }: { compact?: boolean }) {
  const account = useCurrentAccount();
  const label = account ? "Wallet linked" : "Connect wallet";

  return (
    <div className={`wallet-panel ${compact ? "is-compact" : ""} ${account ? "is-linked" : ""}`}>
      <div className="wallet-panel__state">
        <span className={`status-dot ${account ? "online pulse" : ""}`} />
        <strong>{label}</strong>
      </div>
      <div className="wallet-panel__button">
        <ConnectButton connectText={account ? "Wallet" : "Connect Wallet"} />
      </div>
    </div>
  );
}
