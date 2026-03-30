"use client";

import { useDeferredValue } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildAcceptOrderTx,
  buildBuyCoverageTx,
  buildCompleteDeliveryTx,
  buildConfirmPickupTx,
  buildIntelActionTx,
  buildSellerTimeoutCompleteTx,
  estimateCoveragePremiumMist,
  getTradeRoutesChainConfig,
  isLiveTradeRoutesConfig,
} from "./sui-runtime";
import {
  mockHeatmapTiles,
  mockInsurancePool,
  mockIntelReports,
  mockOrders,
  mockReputationProfiles,
  mockTierPolicies,
} from "./mock-data";
import type {
  AcceptOrderInput,
  IntelReportSummary,
  OrderPublicView,
  TradeRoutesSnapshot,
  TradeRoutesState,
} from "./types";

function envState(walletAddress?: string): TradeRoutesState {
  const config = getTradeRoutesChainConfig();
  return {
    mode: isLiveTradeRoutesConfig(config) ? "sui" : "mock",
    walletAddress,
    packageId: config.packageId,
    orderBookId: config.orderBookId,
    profileRegistryId: config.profileRegistryId,
    insurancePoolId: config.insurancePoolId,
    treasuryId: config.treasuryId,
    intelBoardId: config.intelBoardId,
  };
}

export function useTradeRoutes() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const state = envState(account?.address);

  const snapshotQuery = useQuery({
    queryKey: ["trade-routes", "snapshot"],
    queryFn: async () => {
      const response = await fetch("/api/trade-routes/snapshot", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load trade routes snapshot.");
      }

      return (await response.json()) as TradeRoutesSnapshot;
    },
    staleTime: 10_000,
  });

  const ownedCoinsQuery = useQuery({
    queryKey: ["trade-routes", "coins", account?.address],
    queryFn: async () => {
      if (!account?.address) {
        return [];
      }

      const coins = await client.getCoins({
        owner: account.address,
      });

      return coins.data.map((coin) => ({
        objectId: coin.coinObjectId,
        balanceMist: coin.balance,
      }));
    },
    enabled: Boolean(account?.address),
    staleTime: 10_000,
  });

  async function invalidateTradeRoutesData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["trade-routes", "snapshot"] }),
      queryClient.invalidateQueries({ queryKey: ["trade-routes", "coins"] }),
    ]);
  }

  const acceptOrder = useMutation({
    mutationFn: async (input: AcceptOrderInput) => {
      if (state.mode === "mock") {
        if (!account?.address) {
          throw new Error("Connect a wallet before accepting an order.");
        }

        const response = await fetch("/api/trade-routes/orders/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: input.orderId,
            quotedPriceMist: input.quotedPriceMist,
            seller: account.address,
          }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to accept order.");
        }

        return { digest: `mock-accept-${input.orderId}` };
      }

      if (!account?.address) {
        throw new Error("Connect a wallet before accepting an order.");
      }

      const tx = buildAcceptOrderTx({
        config: state,
        orderId: input.orderId,
        quotedPriceMist: input.quotedPriceMist,
        stakeCoinObjectId: input.stakeCoinObjectId,
      });

      return signAndExecute({ transaction: tx });
    },
    onSuccess: invalidateTradeRoutesData,
  });

  const buyCoverage = useMutation({
    mutationFn: async (order: OrderPublicView) => {
      if (state.mode === "mock") {
        const response = await fetch("/api/trade-routes/orders/cover", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: order.orderId }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Coverage purchase failed.");
        }

        return payload;
      }

      if (!account?.address) {
        throw new Error("Connect a wallet before buying coverage.");
      }

      const premiumMist = estimateCoveragePremiumMist(order);
      const eligibleCoin = (ownedCoinsQuery.data ?? [])
        .filter((coin) => BigInt(coin.balanceMist) >= BigInt(premiumMist))
        .sort((left, right) => Number(BigInt(right.balanceMist) - BigInt(left.balanceMist)))[0];

      if (!eligibleCoin) {
        throw new Error("No SUI coin has enough balance to pay the coverage premium.");
      }

      const tx = buildBuyCoverageTx({
        config: state,
        orderId: order.orderId,
        premiumMist,
        fundingCoinObjectId: eligibleCoin.objectId,
      });

      return signAndExecute({ transaction: tx });
    },
    onSuccess: invalidateTradeRoutesData,
  });

  const runIntelAction = useMutation({
    mutationFn: async (input: { reportId: string; action: "support" | "dispute" | "resolve" }) => {
      if (state.mode === "mock") {
        const response = await fetch("/api/trade-routes/intel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reportId: input.reportId,
            action: input.action,
            actor: account?.address,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          report?: IntelReportSummary;
        };
        if (!response.ok || !payload.report) {
          throw new Error(payload.error ?? "Intel action failed.");
        }
        return payload.report;
      }

      if (!account?.address && input.action !== "resolve") {
        throw new Error("Connect a wallet before validating intel.");
      }

      const tx = buildIntelActionTx({
        config: state,
        reportId: input.reportId,
        action: input.action,
      });

      return signAndExecute({ transaction: tx });
    },
    onSuccess: invalidateTradeRoutesData,
  });

  const confirmPickup = useMutation({
    mutationFn: async (orderId: string) => {
      if (state.mode === "mock") {
        const response = await fetch("/api/trade-routes/orders/transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, action: "pickup" }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to confirm pickup.");
        }
        return payload;
      }

      const tx = buildConfirmPickupTx({ config: state, orderId });
      return signAndExecute({ transaction: tx });
    },
    onSuccess: invalidateTradeRoutesData,
  });

  const completeDelivery = useMutation({
    mutationFn: async (orderId: string) => {
      if (state.mode === "mock") {
        const response = await fetch("/api/trade-routes/orders/transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, action: "complete", actor: account?.address }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to complete delivery.");
        }
        return payload;
      }

      const tx = buildCompleteDeliveryTx({ config: state, orderId });
      return signAndExecute({ transaction: tx });
    },
    onSuccess: invalidateTradeRoutesData,
  });

  const sellerTimeoutComplete = useMutation({
    mutationFn: async (orderId: string) => {
      if (state.mode === "mock") {
        const response = await fetch("/api/trade-routes/orders/transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, action: "seller-timeout", actor: account?.address }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to force timeout completion.");
        }
        return payload;
      }

      const tx = buildSellerTimeoutCompleteTx({ config: state, orderId });
      return signAndExecute({ transaction: tx });
    },
    onSuccess: invalidateTradeRoutesData,
  });

  const snapshot = snapshotQuery.data;
  const orders = useDeferredValue(snapshot?.orders ?? mockOrders);

  return {
    ...state,
    source: snapshot?.source ?? "mock-indexer",
    orders,
    heatmap: snapshot?.heatmap ?? mockHeatmapTiles,
    profiles: snapshot?.profiles ?? mockReputationProfiles,
    intelReports: snapshot?.intelReports ?? mockIntelReports,
    tierPolicies: snapshot?.tierPolicies ?? mockTierPolicies,
    insurancePool: snapshot?.insurancePool ?? mockInsurancePool,
    commissionScheduleBps:
      snapshot?.commissionScheduleBps ?? {
        bronze: 800,
        silver: 500,
        gold: 300,
        elite: 150,
      },
    ownedCoins: ownedCoinsQuery.data ?? [],
    isLoading: snapshotQuery.isLoading,
    isAccepting: acceptOrder.isPending,
    isBuyingCoverage: buyCoverage.isPending,
    isActingOnIntel: runIntelAction.isPending,
    isConfirmingPickup: confirmPickup.isPending,
    isCompletingDelivery: completeDelivery.isPending,
    isTimeoutCompleting: sellerTimeoutComplete.isPending,
    acceptError: acceptOrder.error instanceof Error ? acceptOrder.error.message : undefined,
    coverageError: buyCoverage.error instanceof Error ? buyCoverage.error.message : undefined,
    intelActionError:
      runIntelAction.error instanceof Error ? runIntelAction.error.message : undefined,
    refresh: async () => {
      await Promise.all([snapshotQuery.refetch(), ownedCoinsQuery.refetch()]);
    },
    acceptOrder: acceptOrder.mutateAsync,
    buyCoverage: buyCoverage.mutateAsync,
    runIntelAction: runIntelAction.mutateAsync,
    confirmPickup: confirmPickup.mutateAsync,
    completeDelivery: completeDelivery.mutateAsync,
    sellerTimeoutComplete: sellerTimeoutComplete.mutateAsync,
  };
}
