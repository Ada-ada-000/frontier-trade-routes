import {
  getJsonRpcFullnodeUrl,
  SuiJsonRpcClient,
  type DynamicFieldInfo,
  type SuiObjectResponse,
} from "@mysten/sui/jsonRpc";
import fs from "node:fs";
import path from "node:path";
import {
  mockHeatmapTiles,
  mockInsurancePool,
  mockIntelReports,
  mockOrders,
  mockReputationProfiles,
  mockTierPolicies,
} from "./mock-data";
import { buildHeatmap } from "./derive";
import type {
  HeatmapTile,
  IntelReportSummary,
  InsurancePoolSnapshot,
  OrderPublicView,
  ReputationProfile,
  TradeRoutesSnapshot,
} from "./types";

const client = new SuiJsonRpcClient({
  network: "testnet",
  url: getJsonRpcFullnodeUrl("testnet"),
});

const commissionScheduleBps = {
  bronze: 800,
  silver: 500,
  gold: 300,
  elite: 150,
};

type ChainConfig = {
  packageId?: string;
  orderBookId?: string;
  profileRegistryId?: string;
  insurancePoolId?: string;
  treasuryId?: string;
  intelBoardId?: string;
};

let ordersState: OrderPublicView[] = mockOrders.map((order) => ({ ...order }));
let intelReportsState: IntelReportSummary[] = mockIntelReports.map((report) => ({ ...report }));
let profilesState: ReputationProfile[] = mockReputationProfiles.map((profile) => ({ ...profile }));
let insurancePoolState = { ...mockInsurancePool };
const intelParticipantsState = new Map<string, Set<string>>();

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryRpc<T>(label: string, run: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) {
        break;
      }

      const backoffMs = 250 * (attempt + 1);
      console.warn(`[trade-routes] retrying ${label} after transient RPC error`, {
        attempt: attempt + 1,
        backoffMs,
        error: error instanceof Error ? error.message : String(error),
      });
      await wait(backoffMs);
    }
  }

  throw lastError;
}

function readEnvLocalValue(key: string) {
  const candidatePaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "apps/web/.env.local"),
    path.resolve(process.cwd(), "../.env.local"),
  ];

  for (const filePath of candidatePaths) {
    try {
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const lines = fs.readFileSync(filePath, "utf8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          continue;
        }
        const separator = trimmed.indexOf("=");
        if (separator === -1) {
          continue;
        }
        const currentKey = trimmed.slice(0, separator);
        if (currentKey === key) {
          return trimmed.slice(separator + 1).trim();
        }
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

function getChainConfig(): ChainConfig {
  return {
    packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID ?? readEnvLocalValue("NEXT_PUBLIC_SUI_PACKAGE_ID"),
    orderBookId: process.env.NEXT_PUBLIC_ORDER_BOOK_ID ?? readEnvLocalValue("NEXT_PUBLIC_ORDER_BOOK_ID"),
    profileRegistryId:
      process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID ?? readEnvLocalValue("NEXT_PUBLIC_PROFILE_REGISTRY_ID"),
    insurancePoolId:
      process.env.NEXT_PUBLIC_INSURANCE_POOL_ID ?? readEnvLocalValue("NEXT_PUBLIC_INSURANCE_POOL_ID"),
    treasuryId: process.env.NEXT_PUBLIC_PROTOCOL_TREASURY_ID ?? readEnvLocalValue("NEXT_PUBLIC_PROTOCOL_TREASURY_ID"),
    intelBoardId: process.env.NEXT_PUBLIC_INTEL_BOARD_ID ?? readEnvLocalValue("NEXT_PUBLIC_INTEL_BOARD_ID"),
  };
}

function hasLiveSnapshotConfig(chainConfig: ChainConfig) {
  return Boolean(
    chainConfig.packageId &&
      chainConfig.orderBookId &&
      chainConfig.profileRegistryId &&
      chainConfig.insurancePoolId &&
      chainConfig.intelBoardId,
  );
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object") {
    return null;
  }
  return input as Record<string, unknown>;
}

function unwrapFields(input: unknown): Record<string, unknown> | null {
  const record = asRecord(input);
  if (!record) {
    return null;
  }
  if ("fields" in record) {
    return asRecord(record.fields);
  }
  return record;
}

function asMoveFields(object: SuiObjectResponse) {
  const content = object.data?.content;
  if (!content || content.dataType !== "moveObject") {
    return null;
  }
  return asRecord(content.fields);
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

function isZeroAddress(input: string) {
  const normalized = input.trim().toLowerCase();
  return normalized === "0x0" || /^0x0+$/.test(normalized);
}

function bigintString(input: unknown) {
  if (typeof input === "string") {
    return input;
  }
  if (typeof input === "number" || typeof input === "bigint") {
    return String(input);
  }
  const record = asRecord(input);
  if (record && "$kind" in record && record.$kind === "Some" && "Some" in record) {
    return bigintString(record.Some);
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
  if (typeof input === "bigint") {
    return Number(input);
  }
  return 0;
}

function boolValue(input: unknown) {
  if (typeof input === "boolean") {
    return input;
  }
  if (typeof input === "string") {
    return input === "true";
  }
  return Boolean(input);
}

function vectorLength(input: unknown) {
  if (Array.isArray(input)) {
    return input.length;
  }
  const record = asRecord(input);
  if (record && "fields" in record) {
    return vectorLength(record.fields);
  }
  return 0;
}

async function loadDynamicFieldObjectIds(parentId: string) {
  const objectIds: string[] = [];
  let cursor: string | null | undefined = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const page: { data: DynamicFieldInfo[]; nextCursor: string | null; hasNextPage: boolean } =
      await retryRpc(`getDynamicFields(${parentId})`, () =>
        client.getDynamicFields({
          parentId,
          cursor,
          limit: 50,
        }),
      );
    objectIds.push(...page.data.map((field: DynamicFieldInfo) => field.objectId));
    cursor = page.nextCursor;
    hasNextPage = page.hasNextPage;
  }

  return objectIds;
}

async function loadDynamicFieldObjects(parentId: string) {
  const objectIds = await loadDynamicFieldObjectIds(parentId);
  if (objectIds.length === 0) {
    return [];
  }

  const objects: SuiObjectResponse[] = [];
  for (let index = 0; index < objectIds.length; index += 50) {
    const batch = objectIds.slice(index, index + 50);
    const response = await retryRpc(`multiGetObjects(${parentId})`, () =>
      client.multiGetObjects({
        ids: batch,
        options: { showContent: true },
      }),
    );
    objects.push(...response);
  }

  return objects;
}

function parseOrderObject(object: SuiObjectResponse): OrderPublicView | null {
  const fields = asMoveFields(object);
  const value = unwrapFields(fields?.value);
  if (!value) {
    return null;
  }

  return {
    orderId: bigintString(value.order_id),
    buyer: stringValue(value.buyer),
    seller: (() => {
      const seller = stringValue(value.seller);
      return isZeroAddress(seller) ? undefined : seller;
    })(),
    orderMode: numberValue(value.order_mode) === 0 ? "urgent" : "competitive",
    status:
      numberValue(value.status) === 0
        ? "open"
        : numberValue(value.status) === 1
          ? "assigned"
          : numberValue(value.status) === 2
            ? "in_transit"
            : numberValue(value.status) === 3
              ? "completed"
              : "disputed",
    stage:
      numberValue(value.stage) === 0
        ? "hidden"
        : numberValue(value.stage) === 1
          ? "pickup_revealed"
          : numberValue(value.stage) === 2
            ? "destination_revealed"
            : "delivered",
    cargoHint: stringValue(value.cargo_hint),
    originFuzzy: stringValue(value.origin_fuzzy),
    destinationFuzzy: stringValue(value.destination_fuzzy),
    rewardBudgetMist: bigintString(value.reward_budget),
    quotedPriceMist: bigintString(value.quoted_price),
    minReputationScore: numberValue(value.min_reputation_score),
    requiredStakeMist: bigintString(value.required_stake_amount),
    insured: boolValue(value.insured),
    bidCount: vectorLength(value.bids),
    createdAtMs: bigintString(value.created_at_ms),
    deadlineMs: bigintString(value.deadline_ms),
  };
}

function parseProfileObject(object: SuiObjectResponse): ReputationProfile | null {
  const fields = asMoveFields(object);
  const value = unwrapFields(fields?.value);
  if (!value) {
    return null;
  }

  return {
    owner: stringValue(value.owner),
    score: numberValue(value.score),
    successCount: numberValue(value.success_count),
    failCount: numberValue(value.fail_count),
    tier: numberValue(value.tier),
    activeStakeMist: bigintString(value.active_stake),
    totalSlashedMist: bigintString(value.total_slashed),
  };
}

function parseIntelObject(object: SuiObjectResponse): IntelReportSummary | null {
  const fields = asMoveFields(object);
  const value = unwrapFields(fields?.value);
  if (!value) {
    return null;
  }

  const statusCode = numberValue(value.status);
  const status =
    statusCode === 1 ? "confirmed" : statusCode === 2 ? "disputed" : statusCode === 3 ? "false" : "pending";

  return {
    reportId: `intel-${bigintString(value.report_id)}`,
    reporter: stringValue(value.reporter),
    orderHint: bigintString(value.order_hint),
    regionFuzzy: stringValue(value.region_fuzzy),
    signalKind: numberValue(value.signal_kind),
    confidenceBps: numberValue(value.confidence_bps),
    status,
    supportCount: numberValue(value.support_count),
    disputeCount: numberValue(value.dispute_count),
    linkedOrderCount: numberValue(value.linked_order_count),
    validationScore: numberValue(value.validation_score),
    verified: boolValue(value.verified),
    truthful: boolValue(value.truthful),
    expiresAtMs: bigintString(value.expires_at_ms),
  };
}

function parseInsurancePoolSnapshot(object: SuiObjectResponse): InsurancePoolSnapshot | null {
  const fields = asMoveFields(object);
  if (!fields) {
    return null;
  }

  return {
    capitalMist: bigintString(unwrapFields(fields.capital)?.value ?? fields.capital),
    totalPremiumsCollectedMist: bigintString(fields.total_premiums_collected),
    totalClaimsPaidMist: bigintString(fields.total_claims_paid),
    totalRecoveriesMist: bigintString(fields.total_recoveries),
  };
}

function computeValidationScore(report: IntelReportSummary) {
  const supportComponent = report.supportCount * 15;
  const linkedOrderComponent = report.linkedOrderCount * 20;
  const confidenceComponent = Math.floor(report.confidenceBps / 1000);
  const disputePenalty = report.disputeCount * 18;
  return Math.max(0, supportComponent + linkedOrderComponent + confidenceComponent - disputePenalty);
}

function deriveIntelStatus(report: IntelReportSummary): IntelReportSummary["status"] {
  if (report.validationScore >= 80) {
    return "confirmed";
  }
  if (report.disputeCount >= 3 && report.supportCount === 0) {
    return "false";
  }
  if (report.validationScore >= 40 || report.disputeCount > 0) {
    return "disputed";
  }
  return "pending";
}

function syncIntelReport(report: IntelReportSummary) {
  report.validationScore = computeValidationScore(report);
  report.status = deriveIntelStatus(report);
  report.verified = report.status !== "pending";
  report.truthful = report.status === "confirmed";
}

function ensureProfile(owner: string) {
  let profile = profilesState.find((item) => item.owner === owner);
  if (!profile) {
    profile = {
      owner,
      score: 500,
      successCount: 0,
      failCount: 0,
      tier: 0,
      activeStakeMist: "0",
      totalSlashedMist: "0",
    };
    profilesState = [profile, ...profilesState];
  }
  return profile;
}

async function getLiveTradeRoutesSnapshot(chainConfig: ChainConfig): Promise<TradeRoutesSnapshot> {
  const [orderObjects, profileObjects, intelObjects, insuranceObject] = await Promise.all([
    loadDynamicFieldObjects(chainConfig.orderBookId!),
    loadDynamicFieldObjects(chainConfig.profileRegistryId!),
    loadDynamicFieldObjects(chainConfig.intelBoardId!),
    retryRpc(`getObject(${chainConfig.insurancePoolId!})`, () =>
      client.getObject({
        id: chainConfig.insurancePoolId!,
        options: { showContent: true },
      }),
    ),
  ]);

  const orders: OrderPublicView[] = orderObjects
    .map(parseOrderObject)
    .filter((order): order is OrderPublicView => Boolean(order))
    .sort((left, right) => Number(right.createdAtMs) - Number(left.createdAtMs));

  const profiles: ReputationProfile[] = profileObjects
    .map(parseProfileObject)
    .filter((profile): profile is ReputationProfile => Boolean(profile))
    .sort((left, right) => right.score - left.score);

  const intelReports: IntelReportSummary[] = intelObjects
    .map(parseIntelObject)
    .filter((report): report is IntelReportSummary => Boolean(report))
    .sort((left, right) => Number(right.expiresAtMs) - Number(left.expiresAtMs));

  const insurancePool = parseInsurancePoolSnapshot(insuranceObject) ?? mockInsurancePool;
  const heatmap: HeatmapTile[] = orders.length > 0 ? buildHeatmap(orders) : mockHeatmapTiles;

  return {
    orders,
    heatmap,
    profiles,
    intelReports,
    tierPolicies: mockTierPolicies,
    insurancePool,
    commissionScheduleBps,
    generatedAt: new Date().toISOString(),
    source: "sui-testnet",
  };
}

export async function getTradeRoutesSnapshot(): Promise<TradeRoutesSnapshot> {
  const chainConfig = getChainConfig();

  if (hasLiveSnapshotConfig(chainConfig)) {
    try {
      return await getLiveTradeRoutesSnapshot(chainConfig);
    } catch (error) {
      console.error("[trade-routes] falling back to mock snapshot", error);
    }
  }

  const heatmap = ordersState.length > 0 ? buildHeatmap(ordersState) : mockHeatmapTiles;

  return {
    orders: ordersState.map((order) => ({ ...order })),
    heatmap,
    profiles: profilesState.map((profile) => ({ ...profile })),
    intelReports: intelReportsState.map((report) => ({ ...report })),
    tierPolicies: mockTierPolicies,
    insurancePool: { ...insurancePoolState },
    commissionScheduleBps,
    generatedAt: new Date().toISOString(),
    source: "mock-indexer",
  };
}

export async function acceptMockOrder(orderId: string, quotedPriceMist: string, seller: string) {
  const order = ordersState.find((item) => item.orderId === orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (order.status !== "open") {
    throw new Error("Order is no longer open.");
  }
  if (Number(quotedPriceMist) <= 0) {
    throw new Error("Quoted price must be greater than zero.");
  }
  if (Number(quotedPriceMist) > Number(order.rewardBudgetMist)) {
    throw new Error("Quoted price is above the route budget.");
  }

  const profile = ensureProfile(seller);
  order.seller = seller;
  order.quotedPriceMist = quotedPriceMist;
  order.status = "assigned";
  order.stage = "pickup_revealed";
  profile.activeStakeMist = String(Number(profile.activeStakeMist) + Number(order.requiredStakeMist));
  return { ...order };
}

export async function confirmMockPickup(orderId: string, actor: string) {
  const order = ordersState.find((item) => item.orderId === orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (order.seller !== actor) {
    throw new Error("Only the assigned seller can confirm pickup.");
  }
  if (order.status !== "assigned" || order.stage !== "pickup_revealed") {
    throw new Error("Order is not ready for pickup confirmation.");
  }

  order.status = "in_transit";
  order.stage = "destination_revealed";
  return { ...order };
}

export async function completeMockDelivery(orderId: string, actor: string) {
  const order = ordersState.find((item) => item.orderId === orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (order.buyer !== actor) {
    throw new Error("Only the buyer can confirm delivery.");
  }
  if (order.status !== "in_transit" || order.stage !== "destination_revealed") {
    throw new Error("Order is not ready to complete.");
  }

  order.status = "completed";
  order.stage = "delivered";
  if (order.seller) {
    const profile = ensureProfile(order.seller);
    profile.successCount += 1;
    profile.score += 15;
    profile.activeStakeMist = String(Math.max(Number(profile.activeStakeMist) - Number(order.requiredStakeMist), 0));
  }
  return { ...order };
}

export async function sellerTimeoutMockDelivery(orderId: string, actor: string) {
  const order = ordersState.find((item) => item.orderId === orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (order.seller !== actor) {
    throw new Error("Only the assigned seller can timeout-complete.");
  }
  if (order.status !== "in_transit" || order.stage !== "destination_revealed") {
    throw new Error("Order is not ready to complete.");
  }

  order.status = "completed";
  order.stage = "delivered";
  const profile = ensureProfile(actor);
  profile.successCount += 1;
  profile.score += 15;
  profile.activeStakeMist = String(Math.max(Number(profile.activeStakeMist) - Number(order.requiredStakeMist), 0));
  return { ...order };
}

export async function buyCoverage(orderId: string) {
  const order = ordersState.find((item) => item.orderId === orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  if (order.insured) {
    throw new Error("This route is already covered.");
  }

  const premiumMist = String(Math.max(Math.floor(Number(order.rewardBudgetMist) * 0.05), 10_000_000));
  order.insured = true;
  insurancePoolState = {
    ...insurancePoolState,
    capitalMist: String(Number(insurancePoolState.capitalMist) + Number(premiumMist)),
    totalPremiumsCollectedMist: String(Number(insurancePoolState.totalPremiumsCollectedMist) + Number(premiumMist)),
  };

  return {
    order: { ...order },
    insurancePool: { ...insurancePoolState },
    premiumMist,
  };
}

export async function updateIntelReport(
  reportId: string,
  action: "support" | "dispute" | "resolve",
  actor?: string,
) {
  const report = intelReportsState.find((item) => item.reportId === reportId);
  if (!report) {
    throw new Error("Intel report not found.");
  }

  if (action === "support" || action === "dispute") {
    if (!actor) {
      throw new Error("Wallet address required for validation actions.");
    }

    const participants = intelParticipantsState.get(reportId) ?? new Set<string>();
    if (participants.has(actor)) {
      throw new Error("You already validated this report.");
    }

    participants.add(actor);
    intelParticipantsState.set(reportId, participants);
  }

  if (action === "support") {
    report.supportCount += 1;
  } else if (action === "dispute") {
    report.disputeCount += 1;
  } else {
    if (report.status !== "pending") {
      throw new Error("This report is already resolved.");
    }
    if (Date.now() < Number(report.expiresAtMs)) {
      throw new Error("This report is still in its validation window.");
    }
  }

  syncIntelReport(report);
  return { ...report };
}
