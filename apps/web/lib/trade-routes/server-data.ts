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
  IntelReportSummary,
  OrderPublicView,
  ReputationProfile,
  TradeRoutesSnapshot,
} from "./types";

let ordersState: OrderPublicView[] = mockOrders.map((order) => ({ ...order }));
let intelReportsState: IntelReportSummary[] = mockIntelReports.map((report) => ({ ...report }));
let profilesState: ReputationProfile[] = mockReputationProfiles.map((profile) => ({ ...profile }));
const intelParticipantsState = new Map<string, Set<string>>();

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

export async function getTradeRoutesSnapshot(): Promise<TradeRoutesSnapshot> {
  const heatmap = ordersState.length > 0 ? buildHeatmap(ordersState) : mockHeatmapTiles;

  return {
    orders: ordersState.map((order) => ({ ...order })),
    heatmap,
    profiles: profilesState.map((profile) => ({ ...profile })),
    intelReports: intelReportsState.map((report) => ({ ...report })),
    tierPolicies: mockTierPolicies,
    insurancePool: mockInsurancePool,
    commissionScheduleBps: {
      bronze: 800,
      silver: 500,
      gold: 300,
      elite: 150,
    },
    generatedAt: new Date().toISOString(),
    source: "mock-indexer",
  };
}

export async function acceptMockOrder(
  orderId: string,
  quotedPriceMist: string,
  seller: string,
) {
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
  profile.activeStakeMist = String(
    Number(profile.activeStakeMist) + Number(order.requiredStakeMist),
  );
  return { ...order };
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
