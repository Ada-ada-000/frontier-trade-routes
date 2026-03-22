"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function WalletPanel({ compact = false }: { compact?: boolean }) {
  const account = useCurrentAccount();
  const label = account
    ? `Wallet / ${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : "Wallet / Offline";

  return (
    <div className={`wallet-panel ${compact ? "is-compact" : ""}`}>
      <div className="wallet-panel__state">
        <span className={`status-dot ${account ? "online" : "offline"}`} />
        <div>
          <strong>{label}</strong>
        </div>
      </div>
      <div className="wallet-panel__button">
        <ConnectButton connectText={account ? "Manage Link" : "Connect Wallet"} />
      </div>
    </div>
  );
}
