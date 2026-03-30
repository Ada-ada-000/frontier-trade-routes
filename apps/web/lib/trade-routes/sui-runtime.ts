"use client";

import { Transaction } from "@mysten/sui/transactions";
import type { OrderPublicView } from "./types";

const CLOCK_OBJECT_ID = "0x6";

export interface TradeRoutesChainConfig {
  packageId?: string;
  orderBookId?: string;
  profileRegistryId?: string;
  insurancePoolId?: string;
  treasuryId?: string;
  intelBoardId?: string;
}

export function getTradeRoutesChainConfig(): TradeRoutesChainConfig {
  return {
    packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID,
    orderBookId: process.env.NEXT_PUBLIC_ORDER_BOOK_ID,
    profileRegistryId: process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID,
    insurancePoolId: process.env.NEXT_PUBLIC_INSURANCE_POOL_ID,
    treasuryId: process.env.NEXT_PUBLIC_PROTOCOL_TREASURY_ID,
    intelBoardId: process.env.NEXT_PUBLIC_INTEL_BOARD_ID,
  };
}

export function isLiveTradeRoutesConfig(config: TradeRoutesChainConfig) {
  return Boolean(config.packageId && config.orderBookId && config.profileRegistryId);
}

export function estimateCoveragePremiumMist(order: OrderPublicView) {
  return String(Math.max(Math.floor(Number(order.rewardBudgetMist) * 0.05), 10_000_000));
}

function requireField(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`${label} is not configured.`);
  }
  return value;
}

export function buildAcceptOrderTx(input: {
  config: TradeRoutesChainConfig;
  orderId: string;
  quotedPriceMist: string;
  stakeCoinObjectId: string;
}) {
  const packageId = requireField(input.config.packageId, "NEXT_PUBLIC_SUI_PACKAGE_ID");
  const orderBookId = requireField(input.config.orderBookId, "NEXT_PUBLIC_ORDER_BOOK_ID");
  const profileRegistryId = requireField(input.config.profileRegistryId, "NEXT_PUBLIC_PROFILE_REGISTRY_ID");

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::order::accept_order`,
    arguments: [
      tx.object(orderBookId),
      tx.object(profileRegistryId),
      tx.pure.u64(input.orderId),
      tx.pure.u64(input.quotedPriceMist),
      tx.object(input.stakeCoinObjectId),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

export function buildBuyCoverageTx(input: {
  config: TradeRoutesChainConfig;
  orderId: string;
  premiumMist: string;
  fundingCoinObjectId: string;
}) {
  const packageId = requireField(input.config.packageId, "NEXT_PUBLIC_SUI_PACKAGE_ID");
  const orderBookId = requireField(input.config.orderBookId, "NEXT_PUBLIC_ORDER_BOOK_ID");
  const insurancePoolId = requireField(input.config.insurancePoolId, "NEXT_PUBLIC_INSURANCE_POOL_ID");

  const tx = new Transaction();
  const [premiumCoin] = tx.splitCoins(tx.object(input.fundingCoinObjectId), [tx.pure.u64(input.premiumMist)]);
  tx.moveCall({
    target: `${packageId}::order::buy_coverage`,
    arguments: [
      tx.object(orderBookId),
      tx.object(insurancePoolId),
      tx.pure.u64(input.orderId),
      premiumCoin,
    ],
  });
  return tx;
}

export function buildConfirmPickupTx(input: { config: TradeRoutesChainConfig; orderId: string }) {
  const packageId = requireField(input.config.packageId, "NEXT_PUBLIC_SUI_PACKAGE_ID");
  const orderBookId = requireField(input.config.orderBookId, "NEXT_PUBLIC_ORDER_BOOK_ID");
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::order::confirm_pickup`,
    arguments: [tx.object(orderBookId), tx.pure.u64(input.orderId), tx.object(CLOCK_OBJECT_ID)],
  });
  return tx;
}

export function buildCompleteDeliveryTx(input: { config: TradeRoutesChainConfig; orderId: string }) {
  const packageId = requireField(input.config.packageId, "NEXT_PUBLIC_SUI_PACKAGE_ID");
  const orderBookId = requireField(input.config.orderBookId, "NEXT_PUBLIC_ORDER_BOOK_ID");
  const profileRegistryId = requireField(input.config.profileRegistryId, "NEXT_PUBLIC_PROFILE_REGISTRY_ID");
  const treasuryId = requireField(input.config.treasuryId, "NEXT_PUBLIC_PROTOCOL_TREASURY_ID");
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::order::complete_delivery_with_commission`,
    arguments: [
      tx.object(orderBookId),
      tx.object(profileRegistryId),
      tx.object(treasuryId),
      tx.pure.u64(input.orderId),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

export function buildSellerTimeoutCompleteTx(input: { config: TradeRoutesChainConfig; orderId: string }) {
  const packageId = requireField(input.config.packageId, "NEXT_PUBLIC_SUI_PACKAGE_ID");
  const orderBookId = requireField(input.config.orderBookId, "NEXT_PUBLIC_ORDER_BOOK_ID");
  const profileRegistryId = requireField(input.config.profileRegistryId, "NEXT_PUBLIC_PROFILE_REGISTRY_ID");
  const treasuryId = requireField(input.config.treasuryId, "NEXT_PUBLIC_PROTOCOL_TREASURY_ID");
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::order::seller_timeout_complete_with_commission`,
    arguments: [
      tx.object(orderBookId),
      tx.object(profileRegistryId),
      tx.object(treasuryId),
      tx.pure.u64(input.orderId),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });
  return tx;
}

export function buildIntelActionTx(input: {
  config: TradeRoutesChainConfig;
  reportId: string;
  action: "support" | "dispute" | "resolve";
}) {
  const packageId = requireField(input.config.packageId, "NEXT_PUBLIC_SUI_PACKAGE_ID");
  const intelBoardId = requireField(input.config.intelBoardId, "NEXT_PUBLIC_INTEL_BOARD_ID");

  const tx = new Transaction();
  const target =
    input.action === "support"
      ? `${packageId}::intel::support_report`
      : input.action === "dispute"
        ? `${packageId}::intel::dispute_report`
        : `${packageId}::intel::resolve_report`;

  const args =
    input.action === "resolve"
      ? [tx.object(intelBoardId), tx.pure.u64(input.reportId.replace("intel-", "")), tx.object(CLOCK_OBJECT_ID)]
      : [tx.object(intelBoardId), tx.pure.u64(input.reportId.replace("intel-", ""))];

  tx.moveCall({
    target,
    arguments: args,
  });

  return tx;
}
