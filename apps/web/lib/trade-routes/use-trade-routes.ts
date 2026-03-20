"use client";

import { useDeferredValue } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SuiMoveObject, SuiObjectResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { mockHeatmapTiles, mockOrders } from "./mock-data";
import type { AcceptOrderInput, HeatmapTile, OrderPublicView, TradeRoutesState } from "./types";

const CLOCK_OBJECT_ID = "0x6";

function envState(walletAddress?: string): TradeRoutesState {
  return {
    mode:
      process.env.NEXT_PUBLIC_SUI_PACKAGE_ID &&
      process.env.NEXT_PUBLIC_ORDER_BOOK_ID &&
      process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID
        ? "sui"
        : "mock",
    walletAddress,
    packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID,
    orderBookId: process.env.NEXT_PUBLIC_ORDER_BOOK_ID,
    profileRegistryId: process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID,
    insurancePoolId: process.env.NEXT_PUBLIC_INSURANCE_POOL_ID,
  };
}

function stringValue(input: unknown) {
  if (typeof input === "string") {
    return input;
  }
  if (Array.isArray(input)) {
    return new TextDecoder().decode(new Uint8Array(input.map((value) => Number(value))));
  }
  return "";
}

function bigIntString(input: unknown) {
  if (typeof input === "string") {
    return input;
  }
  if (typeof input === "number" || typeof input === "bigint") {
    return String(input);
  }
  return "0";
}

function numberValue(input: unknown) {
  if (typeof input === "number") {
    return input;
  }
  if (typeof input === "string") {
    return Number(input);
  }
  return 0;
}

function boolValue(input: unknown) {
  return Boolean(input);
}

function asMoveFields(object: SuiObjectResponse) {
  const content = object.data?.content;
  if (!content || content.dataType !== "moveObject") {
    return null;
  }
  return (content as SuiMoveObject).fields as Record<string, unknown>;
}

function parseOrderObject(object: SuiObjectResponse): OrderPublicView | null {
  const fields = asMoveFields(object);
  const value = fields?.value as { fields?: Record<string, unknown> } | undefined;
  const order = value?.fields;
  const bids = Array.isArray(order?.bids) ? order.bids : [];
  if (!order) {
    return null;
  }

  return {
    orderId: bigIntString(order.order_id),
    buyer: stringValue(order.buyer),
    seller: stringValue(order.seller) === "0x0" ? undefined : stringValue(order.seller),
    orderMode: numberValue(order.order_mode) === 0 ? "urgent" : "competitive",
    status:
      numberValue(order.status) === 0
        ? "open"
        : numberValue(order.status) === 1
          ? "assigned"
          : numberValue(order.status) === 2
            ? "in_transit"
            : numberValue(order.status) === 3
              ? "completed"
              : "disputed",
    stage:
      numberValue(order.stage) === 0
        ? "hidden"
        : numberValue(order.stage) === 1
          ? "pickup_revealed"
          : numberValue(order.stage) === 2
            ? "destination_revealed"
            : "delivered",
    cargoHint: stringValue(order.cargo_hint),
    originFuzzy: stringValue(order.origin_fuzzy),
    destinationFuzzy: stringValue(order.destination_fuzzy),
    rewardBudgetMist: bigIntString(order.reward_budget),
    quotedPriceMist: bigIntString(order.quoted_price),
    minReputationScore: numberValue(order.min_reputation_score),
    requiredStakeMist: bigIntString(order.required_stake_amount),
    insured: boolValue(order.insured),
    bidCount: bids.length,
    createdAtMs: bigIntString(order.created_at_ms),
    deadlineMs: bigIntString(order.deadline_ms),
  };
}

function buildHeatmap(orders: OrderPublicView[]): HeatmapTile[] {
  const bucket = new Map<string, HeatmapTile>();

  for (const order of orders) {
    for (const region of [order.originFuzzy, order.destinationFuzzy]) {
      const current = bucket.get(region) ?? {
        region,
        intensity: 0,
        demandCount: 0,
        insuredCount: 0,
        urgentCount: 0,
      };

      current.demandCount += 1;
      current.intensity += order.orderMode === "urgent" ? 24 : 16;
      if (order.insured) {
        current.insuredCount += 1;
        current.intensity += 8;
      }
      if (order.orderMode === "urgent") {
        current.urgentCount += 1;
      }

      bucket.set(region, current);
    }
  }

  return [...bucket.values()]
    .map((item) => ({ ...item, intensity: Math.min(item.intensity, 100) }))
    .sort((left, right) => right.intensity - left.intensity);
}

export function useTradeRoutes() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const state = envState(account?.address);

  const ordersQuery = useQuery({
    queryKey: ["trade-routes", "orders", state.mode, state.orderBookId],
    queryFn: async () => {
      if (state.mode === "mock" || !state.orderBookId) {
        return mockOrders;
      }

      const dynamicFields = await client.getDynamicFields({
        parentId: state.orderBookId,
        limit: 50,
      });

      if (dynamicFields.data.length === 0) {
        return [];
      }

      const objects = await client.multiGetObjects({
        ids: dynamicFields.data.map((field) => field.objectId),
        options: { showContent: true },
      });

      return objects
        .map(parseOrderObject)
        .filter((order): order is OrderPublicView => Boolean(order))
        .sort((left, right) => Number(right.createdAtMs) - Number(left.createdAtMs));
    },
    staleTime: 20_000,
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

  const acceptOrder = useMutation({
    mutationFn: async (input: AcceptOrderInput) => {
      if (state.mode === "mock") {
        return { digest: `mock-accept-${input.orderId}` };
      }
      if (!state.packageId || !state.orderBookId || !state.profileRegistryId) {
        throw new Error("Missing package or shared object ids for live accept_order.");
      }
      if (!account?.address) {
        throw new Error("Connect a wallet before accepting an order.");
      }

      const tx = new Transaction();
      tx.moveCall({
        target: `${state.packageId}::order::accept_order`,
        arguments: [
          tx.object(state.orderBookId),
          tx.object(state.profileRegistryId),
          tx.pure.u64(input.orderId),
          tx.pure.u64(input.quotedPriceMist),
          tx.object(input.stakeCoinObjectId),
          tx.object(CLOCK_OBJECT_ID),
        ],
      });

      return signAndExecute({ transaction: tx });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trade-routes", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["trade-routes", "coins"] }),
      ]);
    },
  });

  const orders = useDeferredValue(ordersQuery.data ?? mockOrders);
  const heatmap = orders.length > 0 ? buildHeatmap(orders) : mockHeatmapTiles;

  return {
    ...state,
    orders,
    heatmap,
    ownedCoins: ownedCoinsQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    isAccepting: acceptOrder.isPending,
    acceptError: acceptOrder.error instanceof Error ? acceptOrder.error.message : undefined,
    refresh: ordersQuery.refetch,
    acceptOrder: acceptOrder.mutateAsync,
  };
}
