"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function WalletPanel() {
  const account = useCurrentAccount();

  return (
    <div className="wallet-panel">
      <div className="wallet-copy">
        <span className={`status-dot ${account ? "online" : "offline"}`} />
        <div>
          <strong>{account ? "Wallet connected" : "Wallet required"}</strong>
          <p>
            {account
              ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
              : "Connect EVE Vault or any Sui-compatible wallet."}
          </p>
        </div>
      </div>
      <ConnectButton />
    </div>
  );
}
