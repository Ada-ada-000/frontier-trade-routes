"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function WalletPanel({ compact = false }: { compact?: boolean }) {
  const account = useCurrentAccount();

  return (
    <div className={`wallet-panel ${compact ? "is-compact" : ""}`}>
      <div className="wallet-panel__state">
        <span className={`status-dot ${account ? "online" : "offline"}`} />
        <div>
          <p className="eyebrow">Wallet Link</p>
          <strong>{account ? "Terminal linked" : "Terminal offline"}</strong>
          <span className="wallet-panel__meta">
            {account
              ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
              : "EVE Vault / Sui-compatible wallet"}
          </span>
        </div>
      </div>
      <div className="wallet-panel__button">
        <ConnectButton connectText={account ? "Manage Link" : "Connect Wallet"} />
      </div>
    </div>
  );
}
