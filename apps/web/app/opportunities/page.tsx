import { AppShell } from "../../components/app-shell";
import { IntelEventFeed } from "../../components/intel-event-feed";
import { IntelSummary } from "../../components/intel-summary";
import { OpportunityBoard } from "../../components/opportunity-board";
import { RegionStatusBoard } from "../../components/region-status-board";
import { MockOpportunitiesAdapter, getOpportunitiesAdapter } from "../../lib/opportunities";
import { mockIntelEvents, mockRegionStatuses } from "@eve/shared";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunitiesAdapter()
    .list()
    .catch(async () => {
      return new MockOpportunitiesAdapter().list();
    });

  return (
    <AppShell>
      <main className="page-stack">
        <section className="panel stack" id="intel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Opportunities + Intel</p>
              <h1>Frontier situational awareness</h1>
            </div>
            <p className="muted narrow">
              Privacy-aware regional intel with aggregation, delay, and transparent scoring for
              procure and deliver coordination.
            </p>
          </div>
          <div className="formula-box">
            <strong>Score formula</strong>
            <p>opportunity score = demand - supply - risk × 0.7 + adjustment + 50</p>
          </div>
          <div className="formula-box">
            <strong>Privacy model</strong>
            <p>
              Raw intel is processed off-chain. The UI shows delayed, region-level summaries only,
              while verification anchors can be committed on Sui.
            </p>
          </div>
        </section>
        <IntelSummary
          opportunities={opportunities}
          regionStatuses={mockRegionStatuses}
          intelEvents={mockIntelEvents}
        />
        <OpportunityBoard opportunities={opportunities} />
        <div className="two-column">
          <RegionStatusBoard
            regionStatuses={mockRegionStatuses}
            opportunities={opportunities}
          />
          <IntelEventFeed events={mockIntelEvents} />
        </div>
      </main>
    </AppShell>
  );
}
