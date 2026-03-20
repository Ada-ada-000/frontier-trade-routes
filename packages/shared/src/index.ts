export type ContractType = "procure" | "deliver";
export type ContractStatus =
  | "open"
  | "accepted"
  | "completed"
  | "cancelled"
  | "expired";
export type DataSourceMode = "mock" | "live";
export type ExecutionMode = "mock" | "sui";
export type IntelEventType = "combat" | "disruption" | "supply" | "fleet" | "security";
export type RiskLevel = "safe" | "contested" | "unstable" | "critical";
export type AggregationLevel = "region" | "corridor" | "sector";
export type VerificationMode = "mock" | "sui-anchor";

export interface OpportunitySignal {
  id: string;
  regionName: string;
  resourceName: string;
  demandScore: number;
  supplyScore: number;
  riskScore: number;
  adjustment: number;
  source: DataSourceMode;
  summary: string;
}

export interface Opportunity extends OpportunitySignal {
  opportunityScore: number;
}

export interface IntelEvent {
  id: string;
  type: IntelEventType;
  regionName: string;
  title: string;
  summary: string;
  riskLevel: RiskLevel;
  timestamp: string;
  source: DataSourceMode;
  confidence: number;
  resourceName?: string;
  recommendedContractType?: ContractType;
  privacy: IntelPrivacyMeta;
}

export interface RegionStatus {
  id: string;
  regionName: string;
  securityLevel: RiskLevel;
  combatActivity: number;
  logisticsStability: number;
  resourcePressure: number;
  fleetActivity: number;
  source: DataSourceMode;
  lastUpdated: string;
  dominantResource: string;
  summary: string;
  privacy: IntelPrivacyMeta;
}

export interface IntelPrivacyMeta {
  aggregationLevel: AggregationLevel;
  delayedMinutes: number;
  exactLocationHidden: boolean;
  exactActorsHidden: boolean;
  verificationMode: VerificationMode;
  anchoredDigest?: string;
}

export interface ContractFormInput {
  contractType: ContractType;
  resource: string;
  quantity: number;
  targetRegion: string;
  reward: number;
  collateral?: number;
  expirationTimestamp: string;
}

export interface TransactionFeedback {
  phase: "idle" | "loading" | "success" | "error";
  message: string;
  digest?: string;
  explorerUrl?: string;
  mode: ExecutionMode;
}

export interface TradeRouteContract {
  id: string;
  objectId?: string;
  creator: string;
  accepter?: string;
  contractType: ContractType;
  resource: string;
  quantity: number;
  targetRegion: string;
  reward: number;
  collateral: number;
  expirationTimestamp: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  status: ContractStatus;
  source: ExecutionMode;
  txDigest?: string;
  note?: string;
}

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

export interface OpportunitiesAdapter {
  list(): Promise<Opportunity[]>;
}

export interface LiveOpportunitiesConfig {
  endpoint?: string;
}

export const appCopy = {
  name: "Frontier Trade Routes",
  tagline:
    "Turns trusted frontier intel into verifiable player trade and delivery contracts.",
  pitch:
    "A trust and coordination layer for frontier trade built on top of the live universe.",
};

export const featureHighlights = [
  "Privacy-aware frontier intel with aggregation, delay, and onchain verification",
  "Transparent opportunity feed that converts intel into player action",
  "Procure and deliver contracts with wallet-gated lifecycle tracking on Sui",
];

export const defaultIntelPrivacyMeta: IntelPrivacyMeta = {
  aggregationLevel: "region",
  delayedMinutes: 15,
  exactLocationHidden: true,
  exactActorsHidden: true,
  verificationMode: "sui-anchor",
  anchoredDigest: "0xfrontierintelbatch",
};

export const contractTypeLabels: Record<ContractType, string> = {
  procure: "PROCURE",
  deliver: "DELIVER",
};

export const statusLabels: Record<ContractStatus, string> = {
  open: "OPEN",
  accepted: "ACCEPTED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
};

export const statusOrder: ContractStatus[] = [
  "open",
  "accepted",
  "completed",
  "cancelled",
  "expired",
];

export const riskLevelLabels: Record<RiskLevel, string> = {
  safe: "SAFE",
  contested: "CONTESTED",
  unstable: "UNSTABLE",
  critical: "CRITICAL",
};

export const intelEventLabels: Record<IntelEventType, string> = {
  combat: "COMBAT ALERT",
  disruption: "ROUTE DISRUPTION",
  supply: "SUPPLY PRESSURE",
  fleet: "FLEET MOVEMENT",
  security: "SECURITY UPDATE",
};

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeOpportunityScore(signal: OpportunitySignal): number {
  const riskPenalty = Math.round(signal.riskScore * 0.7);
  return clampScore(
    signal.demandScore - signal.supplyScore - riskPenalty + signal.adjustment + 50,
  );
}

export function toSegmentLevel(score: number): number {
  return Math.max(1, Math.min(5, Math.ceil(score / 20)));
}

export function riskTier(score: number): "minimal" | "low" | "moderate" | "critical" {
  if (score >= 70) {
    return "critical";
  }

  if (score >= 45) {
    return "moderate";
  }

  if (score >= 20) {
    return "low";
  }

  return "minimal";
}

export function toOpportunity(signal: OpportunitySignal): Opportunity {
  return {
    ...signal,
    opportunityScore: computeOpportunityScore(signal),
  };
}

export function applyDelayedTimestamp(timestamp: string, delayedMinutes: number): string {
  const time = new Date(timestamp).getTime();
  return new Date(time - delayedMinutes * 60_000).toISOString();
}

export function describePrivacy(meta: IntelPrivacyMeta): string {
  const parts = [
    `${meta.aggregationLevel}-level aggregation`,
    `${meta.delayedMinutes}m delay`,
    meta.exactLocationHidden ? "exact locations hidden" : "location disclosure enabled",
    meta.exactActorsHidden ? "actors hidden" : "actors visible",
    meta.verificationMode === "sui-anchor" ? "Sui-anchored verification" : "mock verification",
  ];

  return parts.join(" · ");
}

export function applyIntelPrivacyToEvent(
  event: Omit<IntelEvent, "privacy" | "timestamp"> & { timestamp: string; privacy?: IntelPrivacyMeta },
  privacy: IntelPrivacyMeta = defaultIntelPrivacyMeta,
): IntelEvent {
  return {
    ...event,
    timestamp: applyDelayedTimestamp(event.timestamp, privacy.delayedMinutes),
    privacy,
  };
}

export function applyIntelPrivacyToRegionStatus(
  region: Omit<RegionStatus, "privacy" | "lastUpdated"> & { lastUpdated: string; privacy?: IntelPrivacyMeta },
  privacy: IntelPrivacyMeta = defaultIntelPrivacyMeta,
): RegionStatus {
  return {
    ...region,
    lastUpdated: applyDelayedTimestamp(region.lastUpdated, privacy.delayedMinutes),
    privacy,
  };
}

export function recommendedContractType(opportunity: OpportunitySignal): ContractType {
  return opportunity.demandScore >= opportunity.supplyScore ? "deliver" : "procure";
}

export function isExpired(expirationTimestamp: string, now = Date.now()): boolean {
  return new Date(expirationTimestamp).getTime() <= now;
}

export function deriveStatus(contract: TradeRouteContract, now = Date.now()): ContractStatus {
  if (contract.status === "open" && isExpired(contract.expirationTimestamp, now)) {
    return "expired";
  }

  return contract.status;
}

export function validateContractInput(input: ContractFormInput): ValidationResult {
  if (!input.resource.trim() || !input.targetRegion.trim()) {
    return { ok: false, message: "Resource and target region are required." };
  }

  if (input.quantity <= 0 || input.reward <= 0) {
    return { ok: false, message: "Quantity and reward must be greater than zero." };
  }

  if (!input.expirationTimestamp) {
    return { ok: false, message: "Expiration timestamp is required." };
  }

  if (new Date(input.expirationTimestamp).getTime() <= Date.now()) {
    return { ok: false, message: "Expiration must be in the future." };
  }

  if ((input.collateral ?? 0) < 0) {
    return { ok: false, message: "Collateral cannot be negative." };
  }

  return { ok: true };
}

export function canAccept(contract: TradeRouteContract): ValidationResult {
  if (deriveStatus(contract) === "expired") {
    return { ok: false, message: "This contract has expired." };
  }

  if (contract.status !== "open") {
    return { ok: false, message: "Only open contracts can be accepted." };
  }

  return { ok: true };
}

export function canComplete(contract: TradeRouteContract): ValidationResult {
  if (deriveStatus(contract) === "expired") {
    return { ok: false, message: "Expired contracts cannot be completed." };
  }

  if (contract.status !== "accepted") {
    return { ok: false, message: "Only accepted contracts can be completed." };
  }

  return { ok: true };
}

export function canCancel(contract: TradeRouteContract): ValidationResult {
  if (deriveStatus(contract) === "expired") {
    return { ok: false, message: "Expired contracts cannot be cancelled." };
  }

  if (contract.status !== "open") {
    return { ok: false, message: "Creator can only cancel open contracts." };
  }

  return { ok: true };
}

export const mockOpportunitySignals: OpportunitySignal[] = [
  {
    id: "signal-1",
    regionName: "Outer Ring",
    resourceName: "Refined Gas",
    demandScore: 84,
    supplyScore: 35,
    riskScore: 42,
    adjustment: 12,
    source: "mock",
    summary: "Industrial routes are active and local stock remains thin.",
  },
  {
    id: "signal-2",
    regionName: "Curse",
    resourceName: "Heavy Fuel",
    demandScore: 78,
    supplyScore: 48,
    riskScore: 61,
    adjustment: 9,
    source: "mock",
    summary: "Escorts are needed because route risk has widened this cycle.",
  },
  {
    id: "signal-3",
    regionName: "Geminate",
    resourceName: "Rare Alloy",
    demandScore: 91,
    supplyScore: 26,
    riskScore: 33,
    adjustment: 14,
    source: "mock",
    summary: "Refinery throughput is ahead of inbound supply for the next window.",
  },
  {
    id: "signal-4",
    regionName: "Providence",
    resourceName: "Construction Parts",
    demandScore: 65,
    supplyScore: 54,
    riskScore: 25,
    adjustment: 8,
    source: "mock",
    summary: "Moderate opportunity with lower volatility and easier delivery.",
  },
];

const rawRegionStatuses: Omit<RegionStatus, "privacy">[] = [
  {
    id: "region-1",
    regionName: "Outer Ring",
    securityLevel: "unstable",
    combatActivity: 63,
    logisticsStability: 44,
    resourcePressure: 81,
    fleetActivity: 57,
    source: "mock",
    lastUpdated: "2026-03-20T08:20:00.000Z",
    dominantResource: "Refined Gas",
    summary: "Inbound stock is thin and hauler escort demand is rising.",
  },
  {
    id: "region-2",
    regionName: "Geminate",
    securityLevel: "contested",
    combatActivity: 46,
    logisticsStability: 61,
    resourcePressure: 88,
    fleetActivity: 51,
    source: "mock",
    lastUpdated: "2026-03-20T08:27:00.000Z",
    dominantResource: "Rare Alloy",
    summary: "Refinery demand remains ahead of inbound alloy supply.",
  },
  {
    id: "region-3",
    regionName: "Curse",
    securityLevel: "critical",
    combatActivity: 91,
    logisticsStability: 23,
    resourcePressure: 72,
    fleetActivity: 84,
    source: "mock",
    lastUpdated: "2026-03-20T08:25:00.000Z",
    dominantResource: "Heavy Fuel",
    summary: "Route volatility is high and escort-backed procurement is favored.",
  },
  {
    id: "region-4",
    regionName: "Providence",
    securityLevel: "safe",
    combatActivity: 18,
    logisticsStability: 79,
    resourcePressure: 52,
    fleetActivity: 26,
    source: "mock",
    lastUpdated: "2026-03-20T08:21:00.000Z",
    dominantResource: "Construction Parts",
    summary: "Lower volatility region with stable inbound logistics and modest demand.",
  },
];

const rawIntelEvents: Omit<IntelEvent, "privacy">[] = [
  {
    id: "intel-1",
    type: "disruption",
    regionName: "Outer Ring",
    title: "Freighter route disruption detected",
    summary: "Two outbound lanes are delayed, lifting delivery reward potential.",
    riskLevel: "unstable",
    timestamp: "2026-03-20T08:22:00.000Z",
    source: "mock",
    confidence: 84,
    resourceName: "Refined Gas",
    recommendedContractType: "deliver",
  },
  {
    id: "intel-2",
    type: "supply",
    regionName: "Geminate",
    title: "Rare alloy shortage widening",
    summary: "Refinery queues are increasing faster than local supply replenishment.",
    riskLevel: "contested",
    timestamp: "2026-03-20T08:18:00.000Z",
    source: "mock",
    confidence: 91,
    resourceName: "Rare Alloy",
    recommendedContractType: "deliver",
  },
  {
    id: "intel-3",
    type: "combat",
    regionName: "Curse",
    title: "Combat pressure elevated on logistics lane",
    summary: "Procurement remains possible, but escort requirements are increasing.",
    riskLevel: "critical",
    timestamp: "2026-03-20T08:14:00.000Z",
    source: "mock",
    confidence: 88,
    resourceName: "Heavy Fuel",
    recommendedContractType: "procure",
  },
  {
    id: "intel-4",
    type: "fleet",
    regionName: "Providence",
    title: "Alliance fleet reposition reduces route pressure",
    summary: "Stable corridor conditions favor lower-risk delivery coordination.",
    riskLevel: "safe",
    timestamp: "2026-03-20T08:09:00.000Z",
    source: "mock",
    confidence: 73,
    resourceName: "Construction Parts",
    recommendedContractType: "deliver",
  },
];

export const mockRegionStatuses: RegionStatus[] = rawRegionStatuses.map((region) =>
  applyIntelPrivacyToRegionStatus(region),
);

export const mockIntelEvents: IntelEvent[] = rawIntelEvents.map((event) =>
  applyIntelPrivacyToEvent(event),
);

export const mockContracts: TradeRouteContract[] = [
  {
    id: "ctr-1",
    creator: "0xcreatordemo",
    accepter: "0xhaulerdemo",
    contractType: "deliver",
    resource: "Rare Alloy",
    quantity: 1200,
    targetRegion: "Geminate",
    reward: 180,
    collateral: 35,
    expirationTimestamp: "2026-03-27T10:00:00.000Z",
    createdAt: "2026-03-19T06:00:00.000Z",
    acceptedAt: "2026-03-19T09:15:00.000Z",
    completedAt: undefined,
    cancelledAt: undefined,
    status: "accepted",
    source: "mock",
    txDigest: "mock-accepted-ctr-1",
    note: "Demo contract seeded from mock storage.",
  },
  {
    id: "ctr-2",
    creator: "0xquartermaster",
    contractType: "procure",
    resource: "Refined Gas",
    quantity: 2400,
    targetRegion: "Outer Ring",
    reward: 220,
    collateral: 0,
    expirationTimestamp: "2026-03-29T18:30:00.000Z",
    createdAt: "2026-03-20T03:30:00.000Z",
    status: "open",
    source: "mock",
    txDigest: "mock-open-ctr-2",
    note: "High-demand route from the mock opportunity board.",
  },
];
