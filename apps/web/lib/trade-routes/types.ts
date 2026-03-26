export type ExecutionMode = "mock" | "sui";
export type OrderMode = "urgent" | "competitive";
export type OrderStatus = "open" | "assigned" | "in_transit" | "completed" | "disputed";
export type OrderStage = "hidden" | "pickup_revealed" | "destination_revealed" | "delivered";

export interface ReputationProfile {
  owner: string;
  score: number;
  successCount: number;
  failCount: number;
  tier: number;
  activeStakeMist: string;
  totalSlashedMist: string;
}

export interface TierPolicy {
  tier: number;
  label: string;
  minScore: number;
  minStakeMist: string;
  maxOrderValueMist: string;
  commissionBps: number;
}

export interface OrderPublicView {
  orderId: string;
  buyer: string;
  seller?: string;
  orderMode: OrderMode;
  status: OrderStatus;
  stage: OrderStage;
  cargoHint: string;
  originFuzzy: string;
  destinationFuzzy: string;
  rewardBudgetMist: string;
  quotedPriceMist: string;
  minReputationScore: number;
  requiredStakeMist: string;
  insured: boolean;
  bidCount: number;
  createdAtMs: string;
  deadlineMs: string;
}

export interface IntelReportSummary {
  reportId: string;
  reporter: string;
  orderHint: string;
  regionFuzzy: string;
  signalKind: number;
  confidenceBps: number;
  status: "pending" | "confirmed" | "disputed" | "false";
  supportCount: number;
  disputeCount: number;
  linkedOrderCount: number;
  validationScore: number;
  verified: boolean;
  truthful: boolean;
  expiresAtMs: string;
}

export interface InsurancePoolSnapshot {
  capitalMist: string;
  totalPremiumsCollectedMist: string;
  totalClaimsPaidMist: string;
  totalRecoveriesMist: string;
}

export interface HeatmapTile {
  region: string;
  intensity: number;
  demandCount: number;
  insuredCount: number;
  urgentCount: number;
}

export interface AcceptOrderInput {
  orderId: string;
  quotedPriceMist: string;
  stakeCoinObjectId: string;
}

export interface TradeRoutesState {
  mode: ExecutionMode;
  walletAddress?: string;
  packageId?: string;
  orderBookId?: string;
  profileRegistryId?: string;
  insurancePoolId?: string;
}

export interface TradeRoutesSnapshot {
  orders: OrderPublicView[];
  heatmap: HeatmapTile[];
  profiles: ReputationProfile[];
  intelReports: IntelReportSummary[];
  tierPolicies: TierPolicy[];
  insurancePool: InsurancePoolSnapshot;
  commissionScheduleBps: Record<string, number>;
  generatedAt: string;
  source: "mock-indexer";
}

export function formatAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function formatMist(value: string) {
  const amount = Number(value) / 1_000_000_000;
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI`;
}

export function formatStage(stage: OrderStage) {
  if (stage === "pickup_revealed") {
    return "Pickup revealed";
  }
  if (stage === "destination_revealed") {
    return "Destination revealed";
  }
  if (stage === "delivered") {
    return "Delivered";
  }
  return "Hidden";
}

export function formatStatus(status: OrderStatus) {
  if (status === "in_transit") {
    return "In transit";
  }
  return status.replace("_", " ");
}

export function formatTierLabel(tier: number) {
  if (tier >= 3) {
    return "Elite";
  }
  if (tier === 2) {
    return "Gold";
  }
  if (tier === 1) {
    return "Silver";
  }
  return "Bronze";
}
