import { AppShell } from "../../../../components/app-shell";
import { InsurancePanel } from "../../../../components/trade-routes/insurance-panel";
import { getTradeRoutesSnapshot } from "../../../../lib/trade-routes/server-data";

export default async function InsurancePageZh({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; covered?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const snapshot = await getTradeRoutesSnapshot();
  const view =
    params.view === "covered" || params.view === "all" || params.view === "needs"
      ? params.view
      : "needs";

  return (
    <AppShell locale="zh">
      <InsurancePanel
        insurancePool={snapshot.insurancePool}
        orders={snapshot.orders}
        commissionScheduleBps={snapshot.commissionScheduleBps}
        locale="zh"
        initialView={view}
        coveredOrderId={params.covered}
      />
    </AppShell>
  );
}
