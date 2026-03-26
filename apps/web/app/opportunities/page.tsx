import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { IntelEventFeed } from "../../components/intel-event-feed";
import { IntelSummary } from "../../components/intel-summary";
import { OpportunityBoard } from "../../components/opportunity-board";
import { MockOpportunitiesAdapter, getOpportunitiesAdapter } from "../../lib/opportunities";
import { getTradeRoutesSnapshot } from "../../lib/trade-routes/server-data";
import { mockIntelEvents, mockRegionStatuses } from "@eve/shared";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const snapshot = await getTradeRoutesSnapshot();
  const opportunities = await getOpportunitiesAdapter()
    .list()
    .catch(async () => {
      return new MockOpportunitiesAdapter().list();
    });

  return (
    <AppShell>
      <main className="page-stack">
        <IntelSummary
          opportunities={opportunities}
          regionStatuses={mockRegionStatuses}
          intelEvents={mockIntelEvents}
          action={
            <Link href="/app#heatmap" className="button tertiary">
              Back to App
            </Link>
          }
        />
        <OpportunityBoard opportunities={opportunities} />
        <IntelEventFeed
          events={mockIntelEvents.slice(0, 4)}
          reports={snapshot.intelReports}
        />
      </main>
    </AppShell>
  );
}
