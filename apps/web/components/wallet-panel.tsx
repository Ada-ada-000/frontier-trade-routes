"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { type AppLocale } from "../lib/i18n";

export function WalletPanel({ compact = false, locale = "en" }: { compact?: boolean; locale?: AppLocale }) {
  const account = useCurrentAccount();
  const isZh = locale === "zh";
  const label = account ? (isZh ? "钱包已连接" : "Wallet linked") : isZh ? "连接钱包" : "Connect wallet";

  return (
    <div className={`wallet-panel ${compact ? "is-compact" : ""} ${account ? "is-linked" : ""}`}>
      <div className="wallet-panel__state">
        <span className={`status-dot ${account ? "online pulse" : ""}`} />
        <strong>{label}</strong>
      </div>
      <div className="wallet-panel__button">
        <ConnectButton connectText={account ? (isZh ? "钱包" : "Wallet") : isZh ? "连接钱包" : "Connect Wallet"} />
      </div>
    </div>
  );
}
