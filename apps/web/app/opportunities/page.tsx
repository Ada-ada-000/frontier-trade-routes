import Link from "next/link";
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
        <section className="panel stack panel--subtle" id="intel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Support Tool</p>
              <h1>Intel</h1>
            </div>
            <Link href="/app#heatmap" className="button tertiary">
              Back to App
            </Link>
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
