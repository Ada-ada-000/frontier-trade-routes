import { AppShell } from "../../../components/app-shell";
import { InsurancePanel } from "../../../components/trade-routes/insurance-panel";
import { getTradeRoutesSnapshot } from "../../../lib/trade-routes/server-data";

export default async function InsurancePage() {
  const snapshot = await getTradeRoutesSnapshot();

  return (
    <AppShell>
      <InsurancePanel
        insurancePool={snapshot.insurancePool}
        orders={snapshot.orders}
        commissionScheduleBps={snapshot.commissionScheduleBps}
      />
    </AppShell>
  );
}
