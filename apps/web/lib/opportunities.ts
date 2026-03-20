import {
  type LiveOpportunitiesConfig,
  type Opportunity,
  type OpportunitiesAdapter,
  mockOpportunitySignals,
  toOpportunity,
} from "@eve/shared";

export class MockOpportunitiesAdapter implements OpportunitiesAdapter {
  async list(): Promise<Opportunity[]> {
    return mockOpportunitySignals.map(toOpportunity).sort((a, b) => {
      return b.opportunityScore - a.opportunityScore;
    });
  }
}

export class LiveOpportunitiesAdapter implements OpportunitiesAdapter {
  constructor(private readonly config: LiveOpportunitiesConfig) {}

  async list(): Promise<Opportunity[]> {
    if (!this.config.endpoint) {
      throw new Error("Live opportunities adapter is not configured.");
    }

    const response = await fetch(this.config.endpoint, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to fetch live opportunity data.");
    }

    const data = (await response.json()) as typeof mockOpportunitySignals;
    return data.map(toOpportunity).sort((a, b) => b.opportunityScore - a.opportunityScore);
  }
}

export function getOpportunitiesAdapter(): OpportunitiesAdapter {
  const mode = process.env.NEXT_PUBLIC_OPPORTUNITIES_MODE;
  if (mode === "live") {
    return new LiveOpportunitiesAdapter({
      endpoint: process.env.NEXT_PUBLIC_OPPORTUNITIES_ENDPOINT,
    });
  }

  return new MockOpportunitiesAdapter();
}
