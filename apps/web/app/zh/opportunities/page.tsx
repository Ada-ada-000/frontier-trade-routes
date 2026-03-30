import Link from "next/link";
import { AppShell } from "../../../components/app-shell";
import { IntelEventFeed } from "../../../components/intel-event-feed";
import { IntelSummary } from "../../../components/intel-summary";
import { OpportunityBoard } from "../../../components/opportunity-board";
import { MockOpportunitiesAdapter, getOpportunitiesAdapter } from "../../../lib/opportunities";
import { getTradeRoutesSnapshot } from "../../../lib/trade-routes/server-data";
import { localizePath } from "../../../lib/i18n";
import { mockIntelEvents, mockRegionStatuses } from "@eve/shared";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPageZh() {
  const snapshot = await getTradeRoutesSnapshot();
  const opportunities = await getOpportunitiesAdapter()
    .list()
    .catch(async () => {
      return new MockOpportunitiesAdapter().list();
    });

  return (
    <AppShell locale="zh">
      <main className="page-stack">
        <IntelSummary
          opportunities={opportunities}
          regionStatuses={mockRegionStatuses}
          intelEvents={mockIntelEvents}
          locale="zh"
          action={
            <Link href={localizePath("/app#heatmap", "zh")} className="button tertiary">
              返回主界面
            </Link>
          }
        />
        <OpportunityBoard opportunities={opportunities} locale="zh" />
        <IntelEventFeed
          events={mockIntelEvents.slice(0, 4)}
          reports={snapshot.intelReports}
          locale="zh"
        />
      </main>
    </AppShell>
  );
}
